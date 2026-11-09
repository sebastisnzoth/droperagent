<?php
/** Pure accounting calculation; never makes payments. Compatible with PHP 7.4+. */
final class DroperAgent_Pix_Calculator {
    const COSTS = ['supplier', 'freight', 'fees', 'taxes', 'other'];
    public static function cents($input) {
        if (!is_string($input) && !is_int($input)) return null;
        $text = trim((string) $input);
        if (!preg_match('/^[0-9]{1,9}(?:[,.][0-9]{1,2})?$/D', $text)) return null;
        $parts = preg_split('/[,.]/', $text);
        return (int) $parts[0] * 100 + (int) str_pad(isset($parts[1]) ? $parts[1] : '', 2, '0', STR_PAD_RIGHT);
    }
    public static function calculate($gross, array $costs) {
        $sale = self::cents($gross);
        if ($sale === null || $sale <= 0) return ['ok' => false, 'error' => 'gross_invalid'];
        $sum = 0;
        foreach (self::COSTS as $key) {
            if (!array_key_exists($key, $costs)) return ['ok' => false, 'error' => 'missing_' . $key];
            $value = self::cents($costs[$key]);
            if ($value === null) return ['ok' => false, 'error' => 'invalid_' . $key];
            if ($key === 'supplier' && $value <= 0) return ['ok' => false, 'error' => 'supplier_required'];
            $sum += $value;
        }
        return [
            'ok' => true, 'gross_cents' => $sale,
            'cost_cents' => $sum, 'margin_cents' => $sale - $sum,
            'payout_enabled' => false,
        ];
    }
}
