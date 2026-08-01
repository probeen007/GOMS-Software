import puppeteer from 'puppeteer';
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 320, height: 812 });
await page.goto('http://localhost:3000/contact.html', { waitUntil: 'networkidle0' });
const info = await page.evaluate(() => {
  const sw = document.documentElement.scrollWidth;
  const el = document.querySelector('a[href="mailto:pmautomobileworks@gmail.com"].text-body');
  const r = el.getBoundingClientRect();
  return { scrollWidth: sw, linkRight: r.right };
});
console.log(JSON.stringify(info));
await browser.close();
