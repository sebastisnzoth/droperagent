import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('screenshots', { recursive: true });

test('desktop dashboard navigation, filter, theme and screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const browserErrors: string[] = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  await page.goto('./');
  await expect(page.getByText('UMA NOVA FORMA DE OPERAR E-COMMERCE')).toBeVisible();
  await page.getByRole('button', { name: 'Explorar painel' }).click();
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  await expect(page.getByText('AMBIENTE DEMO')).toBeVisible();
  await page.screenshot({ path: 'screenshots/dashboard-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Produtos', exact: true }).click();
  await expect(page.getByText('Luminária de mesa portátil')).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar' }).fill('Garrafa');
  await expect(page.getByText('Garrafa térmica minimal')).toBeVisible();
  await expect(page.getByText('Luminária de mesa portátil')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(browserErrors).toEqual([]);
});

test('mobile navigation, layouts and screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const browserErrors: string[] = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Integrações' }).click();
  await expect(page.getByRole('heading', { name: 'Integrações' })).toBeVisible();
  await expect(page.getByText('NÃO CONFIGURADO').first()).toBeVisible();
  await page.screenshot({ path: 'screenshots/dashboard-mobile.png', fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  expect(browserErrors).toEqual([]);
});
