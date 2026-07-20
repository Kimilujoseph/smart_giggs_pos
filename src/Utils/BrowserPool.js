import puppeteer from "puppeteer";

class BrowserPool {
    constructor(maxBrowsers = 3) {
        this.maxBrowsers = maxBrowsers;
        this.pool = [];
        this.isInitializing = false;
        // Queue of { resolve, reject } for callers waiting for an endpoint
        this._waiters = [];
    }

    async intialize() {
        if (this.isInitializing || this.pool.length > 0) return;
        this.isInitializing = true;
        const launches = [];
        for (let i = 0; i < this.maxBrowsers; i++) {
            launches.push(this.createNewBrowserInstance());
        }
        await Promise.all(launches);
        this.isInitializing = false;
    }

    // Alias so both spellings work
    async initialize() {
        return this.intialize();
    }

    async createNewBrowserInstance() {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                    "--no-first-run",
                ],
            });

            const instance = {
                browser,
                wsEndpoint: browser.wsEndpoint(),
                activePages: 0,
            };

            browser.on("disconnected", () => {
                // Remove the dead instance from the pool
                this.pool = this.pool.filter((p) => p.browser !== browser);
                console.warn(`[BrowserPool] Browser disconnected. Pool size: ${this.pool.length}. Replacing...`);
                // Replace it asynchronously
                this.createNewBrowserInstance().catch(console.error);
            });

            this.pool.push(instance);
            console.log(
                `[BrowserPool] Instance ready: ${instance.wsEndpoint} (pool size: ${this.pool.length})`
            );
        } catch (error) {
            console.error("[BrowserPool] Failed to launch browser instance:", error.message);
        }
    }

    /**
     * Returns a wsEndpoint from the least-loaded browser.
     * If every browser is handling at least one page and all slots are saturated,
     * this resolves as soon as a slot is freed via releaseWSEndpoint().
     */
    async getWSEndpoint() {
        // Ensure at least one browser is alive
        if (this.pool.length === 0) {
            await this.intialize();
        }

        // Pick the browser with the fewest active pages
        const instance = this._leastLoaded();
        if (instance) {
            instance.activePages++;
            console.log(
                `[BrowserPool] Assigned: ${instance.wsEndpoint} (activePages: ${instance.activePages})`
            );
            return instance.wsEndpoint;
        }

        // All instances are at capacity — wait until one is released
        return new Promise((resolve, reject) => {
            const TIMEOUT_MS = 30000;
            const timer = setTimeout(() => {
                // Remove this waiter so it doesn't resolve later
                this._waiters = this._waiters.filter((w) => w.resolve !== resolve);
                reject(new Error("[BrowserPool] Timed out waiting for a free browser slot (30s)"));
            }, TIMEOUT_MS);

            this._waiters.push({
                resolve: (wsEndpoint) => {
                    clearTimeout(timer);
                    resolve(wsEndpoint);
                },
                reject,
            });
        });
    }

    _leastLoaded() {
        if (this.pool.length === 0) return null;
        return this.pool.reduce((best, inst) =>
            inst.activePages < best.activePages ? inst : best
        );
    }

    async releaseWSEndpoint(wsEndpoint) {
        const instance = this.pool.find((p) => p.wsEndpoint === wsEndpoint);
        if (!instance) return;

        instance.activePages = Math.max(0, instance.activePages - 1);
        console.log(
            `[BrowserPool] Released: ${wsEndpoint} (activePages: ${instance.activePages})`
        );

        // Wake up the next waiter if there is one
        if (this._waiters.length > 0) {
            const next = this._leastLoaded();
            if (next) {
                next.activePages++;
                const waiter = this._waiters.shift();
                console.log(
                    `[BrowserPool] Dispatch to waiter: ${next.wsEndpoint} (activePages: ${next.activePages})`
                );
                waiter.resolve(next.wsEndpoint);
            }
        }
    }

    async shutdown() {
        // Reject all pending waiters
        for (const waiter of this._waiters) {
            waiter.reject(new Error("[BrowserPool] Pool is shutting down"));
        }
        this._waiters = [];

        for (const instance of this.pool) {
            try {
                await instance.browser.close();
            } catch (_) {
                // Ignore close errors on shutdown
            }
        }
        this.pool = [];
        console.log("[BrowserPool] All instances shut down.");
    }
}

export default new BrowserPool(parseInt(process.env.MAX_BROWSER || "3", 10));