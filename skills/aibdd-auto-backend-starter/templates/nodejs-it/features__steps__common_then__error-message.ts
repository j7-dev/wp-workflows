import { Then } from '@cucumber/cucumber';
import assert from 'assert/strict';
import { TestWorld } from '../../support/world';

Then('錯誤訊息應為 {string}', function (this: TestWorld, expectedMessage: string) {
  assert.ok(this.lastResponse, '沒有 HTTP response');
  const body = this.lastResponse.body;
  const actualMessage = body.message || body.detail || body.error;
  assert.strictEqual(
    actualMessage,
    expectedMessage,
    `預期錯誤訊息「${expectedMessage}」，實際「${actualMessage}」`
  );
});
