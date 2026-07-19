import puppeteer from "puppeteer";

class BrowserPool {
    constructor(maxBrowsers = 5) {
        this.maxBrowsers = maxBrowsers;
        this.pool = [];
        this.currentIndex = 0;
        this.isInitializing = false;
    }
    async intialize() {
        if (this.isInitializing) return;
        this.isInitializing = true;
        for (let i = 0; i < this.maxBrowsers; i++) {
            await this.createNewBrowserInstance()
        }
        this.isInitializing = false

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
                    '--no-first-run'
                ]
            });

            const instance = {
                browser,
                wsEndpoint: browser.wsEndpoint(),
                activePages: 0
            };

            browser.on('disconnected', () => {
                this.pool = this.pool.filter(p => p.browser !== browser)
                this.createNewBrowserInstance().catch(console.error);
            })
            this.pool.push(instance);
            console.log(`Browser Instance Created: ${instance.wsEndpoint} with ${instance.activePages} active pages`);
        } catch (error) {
            console.error("Error in pool", error);
        }
    }

    async getWSEndpoint() {
        if (this.pool.length === 0) {
            await this.intialize();
        }
        //lets find the browser that has the least pages been used
        this.pool.sort((a, b) => a.activePages - b.activePages);
        const selectedInstance = this.pool[0];
        if (!selectedInstance) {
            throw new Error("Could not select a browser instance");
        }
        selectedInstance.activePages++;
        console.log(`Browser Instance Selected: ${selectedInstance.wsEndpoint} with ${selectedInstance.activePages} active pages`);
        return selectedInstance.wsEndpoint;
    }
    async releaseWSEndpoint(wsEndpoint) {
        const instance = this.pool.find(p => p.wsEndpoint === wsEndpoint);
        if (instance) {
            instance.activePages--;
            console.log(`Browser Instance Released: ${wsEndpoint} with ${instance.activePages} active pages`);
        }
    }

    async shutdown() {
        for (const instance of this.pool) {
            await instance.browser.close();
        }
        this.pool = [];
        console.log("All browser instances shut down");
    }

}
export default new BrowserPool(parseInt(process.env.MAX_BROWSER || '3', 10));