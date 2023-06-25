const Page = require('./helpers/page');
let page;
beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');
});

afterEach(async () => {
    await page.close();
});


describe("When logged in", () => {
    beforeEach(async () => {
        await page.login();
        await page.click('a.btn-floating');
    });
    test('Can see blog create form', async () => {
        const text = await page.getContentsOf('form label');
        expect(text).toEqual('Blog Title')
    });
    describe("And using valid inputs", () => {
        beforeEach(async () => {
            await page.type('.title input', 'My Title');
            await page.type('.content input', 'My Content');
            await page.click('form button[type="submit"]');
        });
        test("Submitting takes user to review screen", async () => {
            const h2text = await page.getContentsOf('h5');
            expect(h2text).toEqual('Please confirm your entries');
        });
        test("Submitting then saving adds blog to index page", async () => {
            await page.click('button.green');
            await page.waitFor('.card');

            let title = await page.getContentsOf('.card-title');
            let content = await page.getContentsOf('p');

            expect(title).toEqual('My Title');
            expect(content).toEqual('My Content');
        });
    });
    describe("And using invalid inputs", () => {
        beforeEach(async () => {
            await page.click('form button[type="submit"]');
        });
        test("the form shows an error message", async () => {
            const titleError = await page.getContentsOf('.title .red-text');
            const contentError = await page.getContentsOf('.content .red-text');
            expect(titleError).toEqual('You must provide a value');
            expect(contentError).toEqual('You must provide a value');
        });
    });
});

describe("User is not logged in", () => {
    test('User cannot create blog post', async () => {
        const result = await page.evaluate(() => {
            return fetch('/api/blogs', {
                method: "post",
                credentials: 'same-origin',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ title: 'My blog title', content: 'My blog content.' })
            }).then(res => res.json());
        })

        expect(result).toEqual({ error: 'You must log in!' });
    });
    test('User cannot see posts', async () => {
        const result = await page.evaluate(() => {
            return fetch('/api/blogs', {
                method: "GET",
                credentials: 'same-origin',
                headers: {
                    'Content-type': 'application/json'
                },
            }).then(res => res.json());
        })

        expect(result).toEqual({ error: 'You must log in!' });
    });
});