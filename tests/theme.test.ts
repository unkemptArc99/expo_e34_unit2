import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseTheme, resolveTheme, themeColors, themeStorageKey } from '../src/theme';

test('saved appearance overrides system preference and invalid preferences fall back to the system',()=>{
 assert.equal(parseTheme('dark'),'dark');assert.equal(parseTheme('light'),'light');assert.equal(parseTheme('system'),null);assert.equal(parseTheme(null),null);
 assert.equal(resolveTheme('light',true),'light');assert.equal(resolveTheme('dark',false),'dark');assert.equal(resolveTheme(null,true),'dark');assert.equal(resolveTheme(null,false),'light');
});
test('theme bootstrap applies the correct appearance before the app loads, including unavailable storage',()=>{
 const html=readFileSync('index.html','utf8');const source=html.match(/<script id="theme-init">([\s\S]*?)<\/script>/)![1];
 assert.ok(html.indexOf('id="theme-init"')<html.indexOf('src="/src/main.tsx"'));
 for(const scenario of [{saved:'dark',system:false,expected:'dark'},{saved:'light',system:true,expected:'light'},{saved:null,system:true,expected:'dark'},{saved:'invalid',system:false,expected:'light'},{saved:null,system:true,expected:'dark',storageError:true},{saved:null,system:false,expected:'light',noMedia:true}]){
  const root={dataset:{} as Record<string,string>,style:{} as Record<string,string>};let browserColor='';
  vm.runInNewContext(source,{localStorage:{getItem:(key:string)=>{assert.equal(key,themeStorageKey);if(scenario.storageError)throw new Error('Storage denied');return scenario.saved;}},window:scenario.noMedia?{}:{matchMedia:()=>({matches:scenario.system})},document:{documentElement:root,querySelector:()=>({setAttribute:(_key:string,value:string)=>{browserColor=value;}})}});
  assert.equal(root.dataset.theme,scenario.expected);assert.equal(root.style.colorScheme,scenario.expected);assert.equal(browserColor,themeColors[scenario.expected as 'light'|'dark']);
 }
});
function luminance(hex:string){const values=hex.replace('#','').split('').reduce((pairs:string[],char,index)=>{if(index%2===0)pairs.push(char);else pairs[pairs.length-1]+=char;return pairs;},[]).map(pair=>{const value=parseInt(pair,16)/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;});return values[0]*.2126+values[1]*.7152+values[2]*.0722;}
function contrast(a:string,b:string){const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(values[0]+.05)/(values[1]+.05);}
test('heatmap text meets normal-text contrast in both themes',()=>{
 const css=readFileSync('src/theme.css','utf8');
 for(const block of [css.match(/:root\s*\{([^}]+)\}/)![1],css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)![1]]){
  const tokens=Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[a-f\d]+);/gi)].map(m=>[m[1],m[2].length===4?'#'+m[2].slice(1).split('').map(c=>c+c).join(''):m[2]]));
  for(let level=0;level<5;level++){const ratio=contrast(tokens[`matrix-${level}`],tokens[level===4?'matrix-high-text':'matrix-text']);assert.ok(ratio>=4.5,`Matrix level ${level}: contrast ${ratio.toFixed(2)}`);}
 }
});
