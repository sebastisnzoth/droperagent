<?php
require dirname(__DIR__) . '/integrations/woocommerce/droperagent-pix-ledger/includes/calculator.php';
function assertion($value,$label) {
    if (!$value) { fwrite(STDERR,'FAIL '.$label."\n"); exit(1); }
    echo 'PASS '.$label."\n";
}
$costs=['supplier'=>'130.00','freight'=>'0','fees'=>'0','taxes'=>'0','other'=>'0'];
$r=DroperAgent_Pix_Calculator::calculate('200,00',$costs);
assertion($r['ok'] && $r['margin_cents']===7000, '200 - 130 = 70 BRL');
assertion($r['payout_enabled']===false,'no payouts');
assertion(DroperAgent_Pix_Calculator::cents('1,2')===120,'decimal comma');
assertion(DroperAgent_Pix_Calculator::cents('1.000,20')===null,'no ambiguous thousands');
assertion(DroperAgent_Pix_Calculator::cents('-1')===null,'no negative cost');
assertion(DroperAgent_Pix_Calculator::cents('1.999')===null,'no fractional cent');
assertion(DroperAgent_Pix_Calculator::calculate('200',array_diff_key($costs,['fees'=>1]))['ok']===false,'all costs explicit');
assertion(DroperAgent_Pix_Calculator::calculate('200',array_merge($costs,['supplier'=>'0']))['ok']===false,'positive supplier cost required');
assertion(DroperAgent_Pix_Calculator::calculate('200',array_merge($costs,['taxes'=>'90']))['margin_cents']===-2000,'negative margin reported');
assertion(DroperAgent_Pix_Calculator::calculate('0',$costs)['ok']===false,'gross 0 blocked');
echo "Tests PASS\n";
