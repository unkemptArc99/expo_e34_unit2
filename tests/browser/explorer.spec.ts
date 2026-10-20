import { test, expect, type Page } from '@playwright/test';
async function navigate(page:Page,label:string){if(!await page.locator('.sidebar').isVisible()||await page.getByRole('button',{name:'Open navigation'}).isVisible()){const menu=page.getByRole('button',{name:'Open navigation'});if(await menu.isVisible())await menu.click();}await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:label,exact:true}).click();}
async function company(page:Page,name:string){const menu=page.getByRole('button',{name:'Open navigation'});if(await menu.isVisible())await menu.click();await page.locator('.sidebar-companies').getByRole('button',{name:new RegExp('^'+name)}).click();}

test('overview leads with a complete matrix and drills into a company topic',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Interview patterns',exact:true})).toBeVisible();
 const toggle=page.getByText('View full company matrix',{exact:true});if(await toggle.isVisible())await toggle.click();
 await expect(page.locator('.matrix-table tbody tr')).toHaveCount(5);await expect(page.locator('.matrix-cell').first()).toBeVisible();
 await page.locator('.matrix-table tbody tr').first().locator('.matrix-cell').first().click();await expect(page.getByRole('heading',{name:'Meta',exact:true})).toBeVisible();await expect(page.locator('#questions h2')).toContainText('questions');await expect(page.locator('.active-filters')).toBeVisible();
});
test('ranked topics filter a real, deduplicated question bank',async({page})=>{
 await page.goto('/?view=explore&company=Meta&window=all');await expect(page.getByRole('heading',{name:'Meta',exact:true})).toBeVisible();
 const bar=page.locator('.topic-bar-row').first(),topic=(await bar.getAttribute('aria-label'))!.split(',')[0];await bar.click();await expect(page.locator('#questions h2')).toContainText(topic+' questions');
 const values=(await page.locator('.question-table .score').allTextContents()).map(Number);expect(values).toEqual([...values].sort((a,b)=>b-a));
 const links=await page.locator('.question-table td:first-child a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));expect(new Set(links).size).toBe(links.length);expect(links[0]).toMatch(/^https:\/\/leetcode.com\/problems\//);
 await page.getByRole('searchbox',{name:'Search questions',exact:true}).fill('this-question-does-not-exist');await expect(page.getByRole('heading',{name:'No matching questions'})).toBeVisible();
});
test('time view uses real collection dates and exposes overlapping windows separately',async({page})=>{
 await page.goto('/?view=time&company=Meta&window=all');await expect(page.getByRole('heading',{name:'Meta over time'})).toBeVisible();await expect(page.locator('.trend-card')).toHaveCount(6);await expect(page.locator('.timeline-dates')).toContainText('Feb 21, 2026');await expect(page.locator('.timeline-dates')).toContainText('Jul 12, 2026');
 await page.getByRole('button',{name:'Recency windows',exact:true}).click();await expect(page.locator('.window-table')).toBeVisible();await page.getByRole('slider',{name:'Recency',exact:true}).fill('1');await expect(page).toHaveURL(/window=3m/);await expect(page.locator('.window-table th.current-window')).toContainText('3 months');await expect(page.locator('.bank-context')).toContainText('Last 3 months');
});
test('comparison distinguishes topic similarity, shared questions, and gaps; caps selection at three',async({page})=>{
 await page.goto('/?view=companies&compareCompanies=Meta,Google&window=all');await expect(page.locator('.diverging-chart')).toBeVisible();await expect(page.locator('.comparison-metrics')).toContainText('Question-bank overlap');
 await page.locator('.company-choices label').filter({hasText:'Netflix'}).click();await expect(page.locator('.aligned-table')).toBeVisible();await expect(page.getByRole('checkbox',{name:'Palantir'})).toBeDisabled();
 await page.getByRole('button',{name:'Shared only',exact:true}).click();await expect(page.locator('.question-table tbody tr').first()).toBeVisible();expect(await page.locator('.question-table tbody tr').first().locator('.question-companies > span').count()).toBe(3);
 await page.locator('.company-choices label').filter({hasText:'Netflix'}).click();await page.locator('.company-choices label').filter({hasText:'Google'}).click();await expect(page.getByRole('heading',{name:'Add another company to compare'})).toBeVisible();await expect(page.locator('.diverging-chart')).toHaveCount(0);
});
test('global search opens accessible question details and navigates companies',async({page})=>{
 await page.goto('/');await expect(page.locator('.matrix-table tbody tr')).toHaveCount(5);const search=page.getByRole('combobox',{name:'Search companies or questions'});await search.fill('two sum');await search.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('heading',{name:'Two Sum',exact:true})).toBeVisible();await expect(page.locator('.drawer-topic')).toContainText('Hash Table');await expect(page.getByRole('link',{name:'Practice on LeetCode'})).toHaveAttribute('href','https://leetcode.com/problems/two-sum/');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await search.fill('Netflix');await search.press('Enter');await expect(page.getByRole('heading',{name:'Netflix',exact:true})).toBeVisible();
});
test('tagging, recency and question filters survive reload without page overflow',async({page})=>{
 await page.goto('/?view=explore&company=Meta&window=all');await page.getByText('View options',{exact:false}).click();await page.getByRole('combobox',{name:'Tagging',exact:true}).selectOption('source');await expect(page.getByRole('link',{name:'Tagging report',exact:true}).first()).toBeVisible();
 await page.getByRole('searchbox',{name:'Search questions',exact:true}).fill('two sum');const row=page.getByRole('link',{name:'Two Sum',exact:true}).locator('..').locator('..');await expect(row.locator('.question-tags')).toContainText('Array');
 await page.getByRole('combobox',{name:'Difficulty',exact:true}).selectOption('Easy');await expect(page).toHaveURL(/difficulty=Easy/);await page.reload();await expect(page.getByRole('combobox',{name:'Difficulty',exact:true})).toHaveValue('Easy');await expect(page).toHaveURL(/tagging=source/);
 const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
 await company(page,'Apple');await expect(page.getByRole('heading',{name:'Apple',exact:true})).toBeVisible();await navigate(page,'Over time');await expect(page.getByRole('heading',{name:'Apple over time'})).toBeVisible();
});
