import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

const routes = [
	{
		description: 'matches / to index.astro',
		url: '/',
		h1: 'index.astro',
	},
	{
		description: 'matches /injected-a to to-inject.astro',
		url: '/injected-a',
		h1: 'to-inject.astro',
		hasScript: true,
	},
	{
		description: 'matches /injected-b to to-inject.astro',
		url: '/injected-b',
		h1: 'to-inject.astro',
		hasScript: true,
	},
	{
		description: 'matches /dynamic-a/id-1 to [id].astro',
		url: '/dynamic-a/id-1',
		h1: '[id].astro',
		p: 'id-1',
	},
	{
		description: 'matches /dynamic-a/id-2 to [id].astro',
		url: '/dynamic-a/id-2',
		h1: '[id].astro',
		p: 'id-2',
	},
	{
		description: 'matches /dynamic-b/id-1 to [id].astro',
		url: '/dynamic-b/id-1',
		h1: '[id].astro',
		p: 'id-1',
	},
	{
		description: 'matches /dynamic-b/id-2 to [id].astro',
		url: '/dynamic-b/id-2',
		h1: '[id].astro',
		p: 'id-2',
	},
];

function appendForwardSlash(path) {
	return path.endsWith('/') ? path : path + '/';
}

describe('Reuse injected entrypoint', () => {
	describe('build', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/reuse-injected-entrypoint/',
			});
			await fixture.build();
		});

		routes.forEach(({ description, url, fourOhFour, h1, p, htmlMatch, hasScript = false }) => {
			const isEndpoint = htmlMatch && !h1 && !p;

			it(description, async () => {
				const htmlFile = isEndpoint ? url : `${appendForwardSlash(url)}index.html`;

				if (fourOhFour) {
					assert.equal(fixture.pathExists(htmlFile), false);
					return;
				}

				const html = await fixture.readFile(htmlFile);
				const $ = cheerioLoad(html);

				if (h1) {
					assert.equal($('h1').text(), h1);
				}

				if (p) {
					assert.equal($('p').text(), p);
				}

				if (htmlMatch) {
					assert.equal(html, htmlMatch);
				}

				if (hasScript) {
					assert.equal($('script[type="module"]').length, 1, 'should have client-side script');
				}
			});
		});
	});

	describe('dev', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/reuse-injected-entrypoint/',
			});

			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		routes.forEach(({ description, url, fourOhFour, h1, p, htmlMatch }) => {
			// checks URLs as written above
			it(description, async () => {
				const html = await fixture.fetch(url).then((res) => res.text());
				const $ = cheerioLoad(html);

				if (fourOhFour) {
					assert.equal($('title').text(), '404: Not Found');
					return;
				}

				if (h1) {
					assert.equal($('h1').text(), h1);
				}

				if (p) {
					assert.equal($('p').text(), p);
				}

				if (htmlMatch) {
					assert.equal(html, htmlMatch);
				}

				if (hasScript) {
					assert.equal($('script[type="module"]').length, 1, 'should have client-side script');
				}
			});
		});
	});
});
