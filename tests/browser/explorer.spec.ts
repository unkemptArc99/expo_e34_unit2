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
 await page.locator('.company-choices label').filter({hasText:'Microsoft'}).click();await expect(page.locator('.aligned-table')).toBeVisible();await expect(page.getByRole('checkbox',{name:'Bloomberg'})).toBeDisabled();
 await page.getByRole('button',{name:'Shared only',exact:true}).click();await expect(page.locator('.question-table tbody tr').first()).toBeVisible();expect(await page.locator('.question-table tbody tr').first().locator('.question-companies > span').count()).toBe(3);
 await page.locator('.company-choices label').filter({hasText:'Microsoft'}).click();await page.locator('.company-choices label').filter({hasText:'Google'}).click();await expect(page.getByRole('heading',{name:'Add another company to compare'})).toBeVisible();await expect(page.locator('.diverging-chart')).toHaveCount(0);
});
test('global search opens accessible question details and navigates companies',async({page})=>{
 await page.goto('/');await expect(page.locator('.matrix-table tbody tr')).toHaveCount(5);const search=page.getByRole('combobox',{name:'Search companies or questions'});await search.fill('two sum');await search.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('heading',{name:'Two Sum',exact:true})).toBeVisible();await expect(page.locator('.drawer-topic')).toContainText('Hash Table');await expect(page.getByRole('link',{name:'Practice on LeetCode'})).toHaveAttribute('href','https://leetcode.com/problems/two-sum/');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await search.fill('Microsoft');await search.press('Enter');await expect(page.getByRole('heading',{name:'Microsoft',exact:true})).toBeVisible();
});
test('customer controls hide audit options, preserve filters, and clarify sidebar counts',async({page})=>{
 await page.goto('/?view=explore&company=Meta&window=all&tagging=source');await expect(page.getByRole('heading',{name:'Meta',exact:true})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Tagging',exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:'Tagging report',exact:true})).toHaveCount(0);await expect(page.getByText('View options',{exact:false})).toHaveCount(0);await expect(page).not.toHaveURL(/tagging=/);
 await page.getByRole('searchbox',{name:'Search questions',exact:true}).fill('two sum');const row=page.getByRole('link',{name:'Two Sum',exact:true}).locator('..').locator('..');await expect(row.locator('.question-tags button')).toHaveCount(1);await expect(row.locator('.question-tags')).toContainText('Hash Table');
 await page.getByRole('combobox',{name:'Difficulty',exact:true}).selectOption('Easy');await page.reload();await expect(page.getByRole('combobox',{name:'Difficulty',exact:true})).toHaveValue('Easy');
 const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
 const menu=page.getByRole('button',{name:'Open navigation'});if(await menu.isVisible())await menu.click();
 const sidebar=page.locator('.sidebar-companies');await expect(sidebar.locator('button > span:nth-child(2)')).toHaveText(['Apple','Bloomberg','Google','Meta','Microsoft']);await expect(sidebar).toContainText('Questions');await expect(sidebar.locator('.sidebar-count[aria-label="1,509 unique questions, All time"]')).toBeVisible();
 await sidebar.getByRole('button',{name:/^Apple/}).click();await expect(page.getByRole('heading',{name:'Apple',exact:true})).toBeVisible();await navigate(page,'Over time');await expect(page.getByRole('heading',{name:'Apple over time'})).toBeVisible();
});

test('company fingerprint matches its ranking and Other drills into the same remainder',async({page})=>{
 await page.goto('/?view=explore&company=Meta&window=30d');await expect(page.locator('.topic-bar-row')).toHaveCount(8);
 const ranked=await page.locator('.topic-bar-row').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')!));
 const labels=await page.locator('.fingerprint-bar button').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')!));
 expect(labels.slice(0,8).map(label=>label.replace(/^Meta, /,'').split(':')[0])).toEqual(ranked.map(label=>label.split(',')[0]));
 const total=Number((await page.locator('.company-metrics > div').first().locator('strong').textContent())!.replaceAll(',',''));
 const topCount=ranked.reduce((sum,label)=>sum+Number(label.match(/(\d+) questions$/)![1]),0);
 await page.getByRole('button',{name:/^Meta, Other:/}).click();await expect(page.locator('#questions .count-badge')).toHaveText(String(total-topCount));
});

test('light mode is the default even on dark systems and remembers an explicit choice',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect(page.locator('.matrix-table tbody tr')).toHaveCount(5);
 await expect(page.getByRole('button',{name:'Switch to dark mode'})).toBeVisible();await page.getByRole('button',{name:'Switch to dark mode'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(await page.evaluate(()=>localStorage.getItem('interview-atlas.theme'))).toBe('dark');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.getByRole('button',{name:'Switch to light mode'}).click();expect(await page.evaluate(()=>localStorage.getItem('interview-atlas.theme'))).toBe('light');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.getByRole('button',{name:'Switch to dark mode'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 const colors=await page.locator('.sidebar').evaluate(node=>{const style=getComputedStyle(node);return{background:style.backgroundColor,color:style.color};});expect(colors.background).toBe('rgb(23, 35, 45)');
 const search=page.getByRole('combobox',{name:'Search companies or questions'});await search.fill('two sum');await search.press('Enter');await expect(page.getByRole('dialog')).toBeVisible();expect(await page.getByRole('dialog').evaluate(node=>getComputedStyle(node).backgroundColor)).toBe('rgb(23, 35, 45)');await page.keyboard.press('Escape');
 const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
});
