const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');
const puppeteer = require('puppeteer');
class CustomePage {
    static async build() {
        const browser = await puppeteer.launch({
            headless: true,
            args:['--no=sanbox']
        });

        const page = await browser.newPage();
        const customePage = new CustomePage(page);
        return new Proxy(customePage, {
            get: function (target, property) {
                return target[property] || browser[property] || page[property];
            }
        })
    }

    constructor(page) {
        this.page = page;
    }

    async login() {
        const user = await userFactory();
        const { session, sig } = sessionFactory(user);
        await this.page.setCookie({ name: 'session', value: session });
        await this.page.setCookie({ name: 'session.sig', value: sig });

        await this.page.goto('http://localhost:3000/blogs');
        await this.page.waitFor('a[href="/auth/logout"]');
    }

    async getContentsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }
}


module.exports = CustomePage;