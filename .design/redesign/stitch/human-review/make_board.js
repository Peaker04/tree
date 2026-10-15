const { Jimp } = require('jimp');

async function createBoard() {
  try {
    const img0 = await Jimp.read('00_UI_KIT_SPECIMEN.png');
    const img1 = await Jimp.read('01_TEST_A_STAFF_HOME.png');
    const img2 = await Jimp.read('02_TEST_B_TASK_DETAIL_PROOF.png');

    const w0 = img0.width, h0 = img0.height;
    const w1 = img1.width, h1 = img1.height;
    const w2 = img2.width, h2 = img2.height;

    // We will scale down the specimen sheet if it's too huge, but let's keep original width if we can.
    // Specimen is Desktop width=2560. Test A/B are Mobile width=780.
    // Let's create a board that can fit them.
    // Actually, specimen might be better scaled to match height of the others, or just side-by-side. 
    // Let's just create a huge canvas and place them.
    const gap = 100;
    const titleH = 200;
    
    // Scale mobile screens up 2x so they don't look tiny next to the 2560 desktop frame, or scale desktop down.
    // Let's scale the mobile screens by 2
    img1.resize({ w: w1 * 2 });
    img2.resize({ w: w2 * 2 });
    
    img0.contain({ w: 1000, h: 3000 }); // Scale desktop to a reasonable column width

    const finalW0 = 1000;
    const finalW1 = img1.width;
    const finalW2 = img2.width;
    const maxH = Math.max(img0.height, img1.height, img2.height);

    const boardW = finalW0 + finalW1 + finalW2 + gap * 4;
    const boardH = maxH + titleH + 100;

    const board = new Jimp({ width: boardW, height: boardH, color: 0xFFFFFFFF });

    // Print labels (We'll just draw a black rectangle for the title bar and maybe we can't do text easily without a font, so we'll skip text or use a simple hack)
    // Actually, JIMP has loadFont.
    // Let's just place the images.
    board.composite(img0, gap, titleH);
    board.composite(img1, gap*2 + finalW0, titleH);
    board.composite(img2, gap*3 + finalW0 + finalW1, titleH);

    await board.write('03_NOVYX_UI_KIT_REVIEW_BOARD.png');
    console.log('Board composed: ' + boardW + 'x' + boardH);
  } catch (err) {
    console.error('Error generating board:', err);
  }
}
createBoard();
