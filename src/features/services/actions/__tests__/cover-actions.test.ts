import { describe, it, expect } from 'vitest';
import { removeServiceCover } from '../remove-service-cover';
import { uploadServiceCover } from '../upload-service-cover';

describe('removeServiceCover (smoke)', () => {
  it('rejects a missing serviceId', async () => {
    const res = await removeServiceCover({});
    expect(res).toHaveProperty('error');
  });

  it('rejects a non-uuid serviceId', async () => {
    const res = await removeServiceCover({ serviceId: 'not-uuid' });
    expect(res).toHaveProperty('error');
  });
});

describe('uploadServiceCover (smoke)', () => {
  it('rejects when no file is present', async () => {
    const fd = new FormData();
    fd.set('serviceId', '00000000-0000-0000-0000-000000000001');
    const res = await uploadServiceCover(fd);
    expect(res).toHaveProperty('error');
    if ('error' in res) expect(res.error.message).toContain('No file');
  });

  it('rejects when serviceId is missing', async () => {
    const fd = new FormData();
    const dummy = new File([new Uint8Array([1, 2, 3])], 'a.png', {
      type: 'image/png',
    });
    fd.set('file', dummy);
    const res = await uploadServiceCover(fd);
    expect(res).toHaveProperty('error');
  });

  it('rejects unsupported MIME types', async () => {
    const fd = new FormData();
    fd.set('serviceId', '00000000-0000-0000-0000-000000000001');
    fd.set('file', new File([new Uint8Array([1, 2, 3])], 'a.gif', { type: 'image/gif' }));
    const res = await uploadServiceCover(fd);
    expect(res).toHaveProperty('error');
    if ('error' in res) expect(res.error.message).toContain('Unsupported MIME');
  });
});
