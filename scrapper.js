const fs = require("fs");
const puppeteer = require("puppeteer");
const path = require('path')
const crypto = require('crypto');


async function downloadImage(elementHandle, browser, page) {
  const imageSrc = await page.evaluate(element => element.getAttribute('src'), elementHandle);
  const newPage = await browser.newPage();
  const response = await newPage.goto(imageSrc, { waitUntil: 'domcontentloaded' });
  const imageBuffer = await response.buffer();
  const hashSum = crypto.createHash('md5');
  hashSum.update(imageBuffer);
  const hex = hashSum.digest('hex');
  

  const imageName = `image_${hex}.jpg`;
  const imagePath = `./images/${imageName}`;
  console.log(hex);
  fs.writeFileSync(imagePath, imageBuffer);
  console.log(`Image saved: ${imagePath}`);

  try {
    const captionHandles = await page.evaluateHandle(() => {
      const captions = [...document.querySelectorAll('.text-content')];
      return captions.map(caption => caption.innerText.trim());
    });

    const captionValues = await captionHandles.jsonValue();
    captionValues.forEach(async (caption, index) => {
      const captionPath = `./captions/${hex}.txt`;
      await fs.promises.writeFile(captionPath, caption);
      console.log(`Caption saved: ${captionPath}`);
    });
    return captionValues;
  } catch (error) {
    console.error('Error getting captions:', error);
    throw error;
  } finally {
    await newPage.close();
  }

}

// async function getAllCaptions(page) {
//   try {
//     const captionHandles = await page.evaluateHandle(() => {
//       const captions = [...document.querySelectorAll('.text-content')];
//       return captions.map(caption => caption.innerText.trim());
//     });


//     const captionValues = await captionHandles.jsonValue();
//     captionValues.forEach(async (caption, index) => {
//       const captionPath = `./captions/caption_${index + 1}.txt`;
//       await fs.promises.writeFile(captionPath, caption);
//       console.log(`Caption saved: ${captionPath}`);
//     });
//     return captionValues;
//   } catch (error) {
//     console.error('Error getting captions:', error);
//     throw error;
//   }
// }






const sleep = (timeout) => new Promise(resolve => setTimeout(resolve, timeout))

async function scrapper(url) {
  if (fs.existsSync('chrome-profile/SingletonSocket'))
    fs.unlinkSync('chrome-profile/SingletonSocket')

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    defaultViewport: {
      width: 1500,
      height: 1000,
    },
    userDataDir: path.resolve('chrome-profile')
  });
  const page = await browser.newPage();
  await page.goto(url, { timeout: 30000 });

  await Promise.race([
    page.waitForSelector('.chat-info-wrapper .ChatInfo'),
    page.waitForSelector('.qr-container')
  ])

  if (await page.$('.qr-container')) {
    console.log("QR Code detected")
    await page.waitForFunction(() => {
      return document.querySelector('.qr-container') === null
    })
  }

  await page.waitForSelector('.chat-info-wrapper .ChatInfo', 12000);

  await page.evaluate(() => window.sleepPromise = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout)));

  console.log("Chat loaded");
  await page.waitForSelector('.message-list-item');
  console.log("First message detected");
  console.log("All messages loaded");


  const getNextLoadingElement = async () => {
    try {
      return await page.evaluateHandle(() => {
        const elements = [...document.querySelectorAll('img.with-blurred-bg')].reverse();
        return elements.find(img => img.parentElement.querySelector('.media-loading') || !img.getAttribute('src'));
      });
    } catch (error) {
      console.error('Error in evaluateHandle:', error);
      throw error;
    }
  }

  while (await (await getNextLoadingElement()).jsonValue()) {
    try {
      const element = await getNextLoadingElement();
      if (await element.jsonValue()) {
        console.log("Loading image detected")
        await element.scrollIntoView();

        // wait for the image to load
        await page.evaluate(element => new Promise(async (resolve) => {
          while (element.parentElement.querySelector('.media-loading') || !element.getAttribute('src'))
            await window.sleepPromise(1000)
          resolve()
        }), element)
        console.log("Image loaded")
        await downloadImage(element, browser, page);
        //await getAllCaptions(page)
      
        
        // if you can't find a loading image, give up
        // but make sure we get to the top of the channel before giving up
        while (!await (await getNextLoadingElement()).jsonValue()) {
          // Look for the 'Channel created' indicator, that assures us we are at the top of the channel
          const done = await page.evaluate(() => !![...document.querySelectorAll('.message-list-item .action-message-content')].find(element => element.textContent.trim() === 'Channel created'))
          if (done) {
            console.log("Got to the top!")
            break
          } else {
            // await page.evaluate(() => document.querySelector('.MessageList').scrollTo(0, 0))
            await sleep(2000)
          }
        }
      }
    } catch (error) {
      console.log(error.message)
    }

  }  
};



module.exports = { scrapper }


