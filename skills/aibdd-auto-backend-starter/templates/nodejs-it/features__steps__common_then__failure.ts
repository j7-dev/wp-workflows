import { Then } from '@cucumber/cucumber';
import assert from 'assert/strict';
import { TestWorld } from '../../support/world';

Then('操作失敗', function (this: TestWorld) {
  assert.ok(this.lastResponse, '沒有 HTTP response');
  const status = this.lastResponse.status;
  assert.ok(
    status >= 400 && status < 500,
    `預期失敗（4XX），實際 ${status}`
  );
});
