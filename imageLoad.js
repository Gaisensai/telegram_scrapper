

async function checkImageLoaded(page, imageSelector) {
  // Evaluate the image's natural width and height
  const imageDimensions = await page.evaluate((selector) => {
    const image = document.querySelector(selector);
    if (image) {
      return {
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
    } else {
      return { naturalWidth: 0, naturalHeight: 0 };
    }
  }, imageSelector);

  // Check if the natural dimensions are greater than 1x1, indicating a fully loaded image
  return imageDimensions.naturalWidth > 1 && imageDimensions.naturalHeight > 1;
}

async function waitForImagesToLoad(page, imageSelector, maxAttempts = 1000) {
  let attempts = 0;

  // Wait for images to load
  while (attempts < maxAttempts) {
    // Check if the first image in the channel is loaded
    const isImageLoaded = await checkImageLoaded(page, imageSelector);

    if (isImageLoaded) {
      console.log("Image loaded successfully.");
    } else {
      console.log("Image still loading. Scrolling to trigger loading...");
      // Scroll to trigger loading of the next set of images
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(2000); // Adjust as needed
      attempts++;
    }
  }

  console.log("All images loaded or maximum attempts reached.");
}

module.exports = { waitForImagesToLoad };
