import { test, expect } from '@playwright/test';

test('LIVE login and real API rendering are separate from DEMO data (mock transport)', async ({ page }) => {
  await page.route('https://api.droperagent.test/**', async route => {
    const url=new URL(route.request().url());
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization, Content-Type','access-control-allow-methods':'GET,POST,OPTIONS','content-type':'application/json'};
    if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
    const cases:Record<string,unknown>={
      '/health':{status:'healthy',service:'droperagent-api'},
      '/auth/login':{token:'test-only-memory-token',expiresIn:900},
      '/auth/logout':{success:true},
      '/api/woo/products':{products:[{id:77,name:'Produto API autenticado',status:'draft',price:'33.00',stock_quantity:5,categories:[]}]},
      '/api/woo/orders':{orders:[{id:88,status:'processing',total:'33.00',currency:'BRL',date_created:'2026-11-07T10:00:00',items:[{name:'Produto API autenticado',quantity:1}]}]},
      '/tasks':{tasks:[{id:'api-task-1',type:'health-check',status:'COMPLETED',createdAt:'2026-11-07'}]},
      '/api/agents':{agents:[]}
    };
    if(!Object.hasOwn(cases,url.pathname))return route.fulfill({status:404,headers,body:JSON.stringify({error:'missing'})});
    return route.fulfill({status:200,headers,body:JSON.stringify(cases[url.pathname])});
  });
  await page.goto('./');
  await page.getByRole('button',{name:'Explorar painel'}).click();
  await expect(page.getByRole('button',{name:'Modo LIVE'})).toBeEnabled();
  await page.getByRole('button',{name:'Modo LIVE'}).click();
  await page.getByLabel('Senha do administrador').fill('browser-test-only-password');
  await page.getByRole('button',{name:'Entrar no modo LIVE'}).click();
  await expect(page.getByText('Produto API autenticado').first()).toBeVisible();
  await expect(page.getByText('Luminária de mesa portátil')).toHaveCount(0);
  await page.getByRole('button',{name:'Pedidos',exact:true}).click();
  await expect(page.getByText('#88')).toBeVisible();
  await page.getByRole('button',{name:'Fila de tarefas'}).click();
  await expect(page.getByText('api-task-1')).toBeVisible();
  await page.getByRole('button',{name:'Sair'}).click();
  await expect(page.getByText('AMBIENTE DEMO')).toBeVisible();
});

test('integration status reflects verified WooCommerce and never invents DSers connection', async ({page}) => {
  await page.route('https://api.droperagent.test/health/woocommerce', route =>
    route.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},
      body:JSON.stringify({configured:true,connected:true,checkedAt:'2026-11-08T06:00:00Z'})}));
  await page.goto('./');
  await page.getByRole('button',{name:'Explorar painel'}).click();
  await page.getByRole('button',{name:'Integrações'}).click();
  await expect(page.getByText('CONECTADO · API REST')).toHaveCount(1);
  await expect(page.getByText('NÃO VERIFICADO SEPARADAMENTE')).toHaveCount(1);
  await expect(page.getByText('NÃO VERIFICADO PELA API')).toHaveCount(4);
  await page.getByRole('button',{name:'Diagnóstico',exact:true}).click();
  await expect(page.getByText('API REST CONECTADA')).toBeVisible();
});


test('unverified API must never unlock LIVE just from build-time URL', async ({page}) => {
  await page.route('https://api.droperagent.test/health',route=>route.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({status:'healthy',service:'different-service'})}));
  await page.goto('./');
  await page.getByRole('button',{name:'Explorar painel'}).click();
  await expect(page.getByRole('button',{name:'Modo LIVE'})).toBeDisabled();
  await expect(page.getByText('AMBIENTE DEMO')).toBeVisible();
});
