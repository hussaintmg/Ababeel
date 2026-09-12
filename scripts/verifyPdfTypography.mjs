import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SinglePdfGenerator } from '../utils/pdfGenerator.js';
import * as fonts from '../constants/fonts.js';
import { fitTextToBox, shouldFitText } from '../utils/textFit.js';

test('Ababeel: SinglePdfGenerator produces valid PDF buffer', async () => {
  const generator = new SinglePdfGenerator();
  const buffer = await generator.generate([
    {
      config: { format: 'A4' },
      elements: [
        {
          type: 'text',
          text: 'Ababeel Certificate of Completion',
          css: [
            { property: 'top', value: '50px' },
            { property: 'left', value: '50px' },
            { property: 'width', value: '400px' },
            { property: 'height', value: '40px' },
            { property: 'font-family', value: 'Montserrat' },
            { property: 'font-weight', value: '700' },
            { property: 'font-size', value: '24px' },
          ],
        },
        {
          type: 'text',
          text: 'Very Long Candidate Name That Needs To Shrink To Fit Inside This Specific Box Without Overflowing Or Disappearing',
          css: [
            { property: 'top', value: '120px' },
            { property: 'left', value: '50px' },
            { property: 'width', value: '200px' },
            { property: 'height', value: '30px' },
            { property: 'font-family', value: 'Montserrat' },
            { property: 'font-weight', value: '500' },
            { property: 'font-size', value: '20px' },
            { property: '--text-fit', value: 'shrink' },
          ],
        },
      ],
    },
  ]);

  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 500);
  assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
});

test('Ababeel: textFit correctly shrinks text to fit dimensions', () => {
  const result = fitTextToBox({
    text: 'A very long multiple values string that cannot fit in small width at original size',
    width: 150,
    height: 30,
    fontSize: 20,
    minFontSize: 8,
    lineHeight: size => size * 1.2,
    measure: (val, size) => val.length * (size * 0.5),
  });

  assert.ok(result.fontSize < 20);
  assert.ok(result.fontSize >= 8);
  assert.ok(result.lines.length >= 1);
});

test('Ababeel: font definitions include Anton and numeric weights', () => {
  const anton = fonts.AVAILABLE_FONTS.find(f => f.family === 'Anton');
  assert.ok(anton, 'Anton font must be in AVAILABLE_FONTS');
  const montserratEntries = fonts.AVAILABLE_FONTS.filter(f => f.family.startsWith('Montserrat'));
  assert.ok(montserratEntries.length >= 7, 'Montserrat should have all numeric weights');
});
