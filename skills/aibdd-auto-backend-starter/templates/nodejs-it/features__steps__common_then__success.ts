import { Then } from '@cucumber/cucumber';
import assert from 'assert/strict';
import { TestWorld } from '../../support/world';

Then('操作成功', function (this: TestWorld) {
  assert.ok(this.lastResponse, '沒有 HTTP response');
  const status = this.lastResponse.status;
  assert.ok(
    status >= 200 && status < 300,
    `預期成功（2XX），實際 ${status}`
  );
});
