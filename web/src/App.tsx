import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Bell, Box, Check, ChevronDown, CircleHelp, Clock3, Cloud, Code2, Database, ExternalLink, Filter, Globe2, LayoutDashboard, LockKeyhole, Menu, Moon, Package, RefreshCw, Search, Settings2, ShieldCheck, ShoppingBag, Sun, Terminal, Users, Workflow, X, Zap } from 'lucide-react';

type Page = 'inicio' | 'overview' | 'products' | 'orders' | 'agents' | 'tasks' | 'integrations' | 'settings' | 'diagnostics';
type Mode = 'DEMO' | 'LIVE';
type Item = { id: string; name: string; category: string; price: string; stock: number; status: 'Rascunho' | 'Ativo' | 'Pausado' };
type Order = { id: string; client: string; item: string; amount: string; status: 'Pendente' | 'Processando' | 'Concluído'; date: string };
type Agent = { name: string; area: string; icon: string };
type LiveProduct = { id: number; name: string; status: string; price: string; stock_quantity: number | null; categories: { name: string }[] };
type LiveOrder = { id: number; status: string; total: string; currency: string; date_created: string; items: { name: string; quantity: number }[] };
type LiveTask = { id: string; type: string; status: string; createdAt: string };
type CommerceReview = {
  observedAt: string;
  scope: { productsScanned: number; ordersScanned: number };
  summary: { publishedProducts: number; productsWithVerifiedLandedCost: number; paidOrdersForSupplierReview: number; automaticSupplierPaymentsEnabled: boolean };
  products: { id: number; name: string; price: string; estimatedGrossMarginPercent: number | null; recommendation: string; blockers: string[] }[];
  orders: { id: number; status: string; paid: boolean; requiresSupplierReview: boolean; nextStep: string }[];
};

const products: Item[] = [
  { id: 'PRD-0001', name: 'Luminária de mesa portátil', category: 'Casa & decoração', price: 'R$ 129,90', stock: 42, status: 'Rascunho' },
  { id: 'PRD-0002', name: 'Organizador modular', category: 'Organização', price: 'R$ 89,00', stock: 18, status: 'Ativo' },
  { id: 'PRD-0003', name: 'Garrafa térmica minimal', category: 'Lifestyle', price: 'R$ 74,90', stock: 0, status: 'Pausado' },
  { id: 'PRD-0004', name: 'Suporte articulado', category: 'Escritório', price: 'R$ 169,00', stock: 26, status: 'Rascunho' },
];
const orders: Order[] = [
  { id: '#1001', client: 'Cliente demonstração A', item: 'Organizador modular', amount: 'R$ 89,00', status: 'Concluído', date: '07 nov 2026' },
  { id: '#1002', client: 'Cliente demonstração B', item: 'Luminária de mesa', amount: 'R$ 129,90', status: 'Processando', date: '06 nov 2026' },
  { id: '#1003', client: 'Cliente demonstração C', item: 'Suporte articulado', amount: 'R$ 169,00', status: 'Pendente', date: '06 nov 2026' },
];
const agents: Agent[] = [
  { name: 'Store Architect', area: 'Arquitetura da loja', icon: '01' },
  { name: 'Product Researcher', area: 'Pesquisa de produtos', icon: '02' },
  { name: 'Product Manager', area: 'Catálogo & estoque', icon: '03' },
  { name: 'DSers Operator', area: 'Fornecedores', icon: '04' },
  { name: 'Pricing Engine', area: 'Preços & margens', icon: '05' },
  { name: 'Marketing AI', area: 'Campanhas', icon: '06' },
  { name: 'Customer Support', area: 'Atendimento', icon: '07' },
  { name: 'Finance Analyst', area: 'Financeiro', icon: '08' },
  { name: 'Quality & Security', area: 'Qualidade & segurança', icon: '09' },
];
const connectors = [
  { name: 'WordPress', desc: 'Infraestrutura da loja', initial: 'W', color: 'wp' },
  { name: 'WooCommerce', desc: 'Catálogo, carrinho e pedidos', initial: 'W', color: 'woo' },
  { name: 'DSers', desc: 'Gestão de fornecedores', initial: 'D', color: 'dsers' },
  { name: 'AliExpress', desc: 'Marketplace de sourcing', initial: 'A', color: 'ali' },
  { name: 'OpenClaw', desc: 'Orquestração de agentes', initial: 'O', color: 'claw' },
  { name: 'MCP Server', desc: 'Ferramentas de integração', initial: 'M', color: 'mcp' },
];
const nav: { label: string; page: Page; icon: typeof Activity }[] = [
  { label: 'Visão geral', page: 'overview', icon: LayoutDashboard }, { label: 'Produtos', page: 'products', icon: Package },
  { label: 'Pedidos', page: 'orders', icon: ShoppingBag }, { label: 'Agentes de IA', page: 'agents', icon: Users },
  { label: 'Fila de tarefas', page: 'tasks', icon: Workflow }, { label: 'Integrações', page: 'integrations', icon: Cloud },
  { label: 'Configurações', page: 'settings', icon: Settings2 }, { label: 'Diagnóstico', page: 'diagnostics', icon: Activity },
];
const titles: Record<Page,string> = { inicio:'Sua operação, em um só lugar.', overview:'Visão geral',products:'Produtos', orders:'Pedidos',agents:'Agentes de IA',tasks:'Fila de tarefas',integrations:'Integrações',settings:'Configurações',diagnostics:'Diagnóstico' };
const publicAPI = (import.meta.env.VITE_DROPERAGENT_API_URL || '').replace(/\/$/, '');
const allowedLive = publicAPI.startsWith('https://') && import.meta.env.VITE_ENABLE_LIVE_READONLY === 'true';
// Build configuration alone is not evidence that the remote API exists.
const apiConfigured = allowedLive;

function Brand({compact=false}: {compact?:boolean}) {
  return <div className="brand"><div className="brand-icon"><Box size={23} strokeWidth={2.2}/><span className="brand-pip"/></div>{!compact && <div><strong>droper<span>agent</span></strong><small>COMMERCE OS</small></div>}</div>;
}
function DemoBadge({mode}: {mode:Mode}) {
  return <span className={'mode-badge '+(mode==='DEMO'?'mode-demo':'mode-live')}><span className="mode-dot"/>{mode==='DEMO'?'AMBIENTE DEMO':'LIVE · LEITURA'}</span>;
}
function Empty({title,detail}: {title:string;detail:string}) {
  return <div className="empty"><div className="empty-icon"><Database size={22}/></div><strong>{title}</strong><p>{detail}</p></div>;
}
function Panel({title,subtitle,children,action}: {title:string;subtitle?:string;children:React.ReactNode;action?:React.ReactNode}) {
  return <section className="panel"><div className="panel-heading"><div><h3>{title}</h3>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
function Status({status}: {status:string}) {
  return <span className={'status '+(status==='Ativo'||status==='Concluído'?'good':status==='Pausado'||status==='Pendente'?'warning':'neutral')}><span/>{status}</span>;
}
function Navigation({page,setPage,close}: {page:Page;setPage:(p:Page)=>void;close:()=>void}) {
  return <><div className="nav-group-label">WORKSPACE</div><nav aria-label="Navegação principal"><button className={'nav-item '+(page==='inicio'?'selected':'')} onClick={()=>{setPage('inicio');close();}}><Globe2 size={19}/> <span>Apresentação</span></button></nav><div className="nav-group-label nav-divider">OPERAÇÕES</div><nav aria-label="Ferramentas de operação">{nav.map(({page:p,label,icon:Icon})=><button key={p} className={'nav-item '+(page===p?'selected':'')} onClick={()=>{setPage(p);close();}} aria-current={page===p?'page':undefined}><Icon size={19}/><span>{label}</span>{p==='integrations'&&<span className="nav-count">6</span>}</button>)}</nav></>;
}
function Stats({demo, productCount=0,orderCount=0}: {demo:boolean;productCount?:number;orderCount?:number}) {
  const cards = [
    { label:'Produtos no catálogo', value:demo?'04':productCount<0?'—':String(productCount),change:'4 itens ilustrativos',icon:Package,className:'aqua' },
    { label:'Pedidos registrados',value:demo?'03':orderCount<0?'—':String(orderCount),change:'Sem vendas reais',icon:ShoppingBag,className:'blue' },
    { label:'Agentes conectados',value:'00',change:'Nenhum agente verificado',icon:Users,className:'violet' },
    { label:'Tarefas em execução',value:demo?'02':'—',change:'Exemplo de fluxo',icon:Workflow,className:'orange' }
  ];
  return <div className="stats-grid">{cards.map(({label,value,change,icon:Icon,className})=><div className="stat-card" key={label}><div className={'stat-icon '+className}><Icon size={21}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-desc">{change}</div></div>)}</div>;
}
function ProductTable({demo,search}: {demo:boolean;search:string}) {
  const shown=demo?products.filter(x=>(x.name+' '+x.category+' '+x.id).toLowerCase().includes(search.toLowerCase())):[];
  return shown.length?<div className="table-scroll"><table><thead><tr><th>PRODUTO</th><th>CATEGORIA</th><th>PREÇO</th><th>ESTOQUE</th><th>STATUS</th></tr></thead><tbody>{shown.map(p=><tr key={p.id}><td><div className="item-cell"><div className="product-thumb"><Package size={20}/></div><div><strong>{p.name}</strong><small>{p.id}</small></div></div></td><td>{p.category}</td><td className="strong-cell">{p.price}</td><td>{p.stock}</td><td><Status status={p.status}/></td></tr>)}</tbody></table></div>:<Empty title={demo?'Nenhum produto encontrado':'Nenhum produto conectado'} detail={demo?'Experimente outra busca.':'Conecte uma API WooCommerce segura para consultar dados reais.'}/>;
}
function OrdersTable({demo,search}: {demo:boolean;search:string}) {
  const shown=demo?orders.filter(x=>(x.client+' '+x.item+' '+x.id).toLowerCase().includes(search.toLowerCase())):[];
  return shown.length?<div className="table-scroll"><table><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>PRODUTO</th><th>VALOR</th><th>STATUS</th></tr></thead><tbody>{shown.map(o=><tr key={o.id}><td><strong>{o.id}</strong><small className="block">{o.date}</small></td><td>{o.client}</td><td>{o.item}</td><td className="strong-cell">{o.amount}</td><td><Status status={o.status}/></td></tr>)}</tbody></table></div>:<Empty title={demo?'Nenhum pedido encontrado':'Nenhum pedido conectado'} detail={demo?'Experimente outra busca.':'Os pedidos reais só aparecem após configurar uma API autenticada.'}/>;
}

function LiveProducts({data, search}: {data:LiveProduct[];search:string}) {
  const rows=data.filter(p=>(p.name+' '+p.id).toLowerCase().includes(search.toLowerCase()));
  return rows.length?<div className="table-scroll"><table><thead><tr><th>PRODUTO</th><th>STATUS</th><th>PREÇO</th><th>ESTOQUE</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small className="block">WC #{p.id}</small></td><td>{p.status}</td><td>{p.price||'—'}</td><td>{p.stock_quantity??'—'}</td></tr>)}</tbody></table></div>:<Empty title="Nenhum produto retornado" detail="A loja conectada não retornou produtos correspondentes." />;
}
function LiveOrders({data,search}:{data:LiveOrder[];search:string}) {
  const rows=data.filter(o=>(o.id+' '+o.status).toLowerCase().includes(search.toLowerCase()));
  return rows.length?<div className="table-scroll"><table><thead><tr><th>PEDIDO</th><th>STATUS</th><th>ITENS</th><th>TOTAL</th></tr></thead><tbody>{rows.map(o=><tr key={o.id}><td><strong>#{o.id}</strong><small className="block">{o.date_created?.slice(0,10)||'—'}</small></td><td>{o.status}</td><td>{o.items?.map(i=>i.name).join(', ')||'—'}</td><td>{o.currency} {o.total}</td></tr>)}</tbody></table></div>:<Empty title="Nenhum pedido retornado" detail="A loja conectada não retornou pedidos correspondentes." />;
}
function Pipeline() {
  return <div className="pipeline"><div className="pipeline-title"><div><span className="eyebrow">ARQUITETURA</span><h3>Um fluxo. Várias conexões.</h3></div><span className="pipe-label">VISÃO CONCEITUAL</span></div><div className="pipeline-track">{[{name:'WordPress',sub:'Sua loja',icon:Globe2},{name:'WooCommerce',sub:'Seus produtos',icon:ShoppingBag},{name:'MCP',sub:'Ferramentas',icon:Code2},{name:'Agentes de IA',sub:'Automação',icon:Zap}].map(({name,sub,icon:Icon},i)=><div className="pipeline-segment" key={name}><div className="pipeline-node"><Icon size={23}/></div><div><strong>{name}</strong><small>{sub}</small></div>{i!==3&&<ArrowRight size={17} className="pipeline-arrow"/>}</div>)}</div><div className="pipeline-note"><CircleHelp size={16}/> Esquema de integração. Não indica serviços conectados nesta página.</div></div>;
}
function Home({go}: {go:()=>void}) {
  return <div className="home-page"><div className="home-hero"><div className="hero-kicker"><span className="hero-bullet"/> UMA NOVA FORMA DE OPERAR E-COMMERCE</div><h1>Mais clareza.<br/><em>Menos trabalho</em><br/>no operacional.</h1><p>Seu futuro centro de comando para produtos, pedidos, fornecedores e agentes de IA — com o controle sempre nas suas mãos.</p><div className="hero-actions"><button className="primary" onClick={go}>Explorar painel <ArrowUpRight size={19}/></button><a className="secondary" href="https://github.com/sebastisnzoth/droperagent" target="_blank" rel="noreferrer">Ver repositório <ExternalLink size={16}/></a></div><div className="hero-fine"><ShieldCheck size={17}/> Demonstração pública. Nenhuma venda ou operação real é executada.</div><div className="hero-orbit orbit-1"/><div className="hero-orbit orbit-2"/><div className="hero-orbit orbit-3"><Box size={44}/></div></div><div className="home-below"><div><span className="eyebrow">SOBRE A PLATAFORMA</span><h2>Da ideia à operação, em um só painel.</h2><p>DroperAgent está em desenvolvimento. Esta versão apresenta o design do centro de operações enquanto as conexões reais são verificadas.</p></div><div className="feature-column"><div><Package size={20}/><strong>Catálogo inteligente</strong><span>Organize produtos e acompanhe seus estados.</span></div><div><Workflow size={20}/><strong>Fluxos coordenados</strong><span>Visualize tarefas, integrações e automações.</span></div><div><ShieldCheck size={20}/><strong>Controle transparente</strong><span>Veja o que está conectado — e o que não está.</span></div></div></div></div>;
}
function IntegrationGrid({wooState}: {wooState:'checking'|'connected'|'unconfigured'|'unreachable'|'unknown'}) {
  const label=(name:string)=>{
    if(name==='WordPress') return 'NÃO VERIFICADO SEPARADAMENTE';
    if(name==='WooCommerce') return wooState==='connected'?'CONECTADO · API REST':wooState==='checking'?'VERIFICANDO':wooState==='unconfigured'?'NÃO CONFIGURADO':wooState==='unreachable'?'FALHA NA VERIFICAÇÃO':'NÃO VERIFICADO';
    return 'NÃO VERIFICADO PELA API';
  };
  return <div className="integration-grid">{connectors.map(c=>{
    const state=label(c.name);const verified=state.startsWith('CONECTADO');
    return <div className="integration-card" key={c.name}><div className="connector-top"><span className={'connector-logo '+c.color}>{c.initial}</span><span className={verified?'diagnostic-indicator verified':'offline-dot'} title={state}/></div><strong>{c.name}</strong><small>{c.desc}</small><div className="connector-status"><span/> {state}</div></div>;
  })}</div>;
}
function SectionToolbar({search,setSearch,placeholder}: {search:string;setSearch:(s:string)=>void;placeholder:string}) {return <div className="section-toolbar"><label className="searchbox"><Search size={18}/><input aria-label="Buscar" value={search} onChange={e=>setSearch(e.target.value)} placeholder={placeholder}/></label><span className="sample-caption"><Filter size={15}/> Filtro em tempo real</span></div>;}
function App() {
  const [page,setPage]=useState<Page>('inicio');
  const [mode,setMode]=useState<Mode>('DEMO');
  const [search,setSearch]=useState('');
  const [navOpen,setNavOpen]=useState(false);
  const [theme,setTheme]=useState<'light'|'dark'>(()=>window.localStorage.getItem('droper-theme')==='dark'?'dark':'light');
  const [apiStatus,setApiStatus]=useState<'idle'|'loading'|'healthy'|'error'>('idle');
  const [connectionAttempt,setConnectionAttempt]=useState(0);
  const [wooState,setWooState]=useState<'checking'|'connected'|'unconfigured'|'unreachable'|'unknown'>('checking');
  const [checkedAt,setCheckedAt]=useState('');
  const [password,setPassword]=useState('');
  const [authToken,setAuthToken]=useState('');
  const [loginError,setLoginError]=useState('');
  const [loginBusy,setLoginBusy]=useState(false);
  const [dataError,setDataError]=useState('');
  const [liveProducts,setLiveProducts]=useState<LiveProduct[]>([]);
  const [liveOrders,setLiveOrders]=useState<LiveOrder[]>([]);
  const [liveTasks,setLiveTasks]=useState<LiveTask[]>([]);
  const [liveAgents,setLiveAgents]=useState<{name:string; status:string}[]>([]);
  const [liveLoading,setLiveLoading]=useState(false);
  const [commerceReview,setCommerceReview]=useState<CommerceReview|null>(null);
  const [commerceReviewError,setCommerceReviewError]=useState('');

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (!allowedLive) return;
    setLoginBusy(true);setLoginError('');
    try {
      const response=await fetch(publicAPI+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password}),signal:AbortSignal.timeout(8000)});
      if(!response.ok) throw new Error(response.status===401?'Senha incorreta':response.status===429?'Muitas tentativas. Aguarde 15 minutos.':'Login indisponível (HTTP '+response.status+')');
      const body=await response.json() as {token?:string};
      if(!body.token) throw new Error('O servidor não retornou uma sessão válida');
      setAuthToken(body.token);setPassword('');
    }catch(e){setLoginError(e instanceof Error?e.message:'Falha de conexão');}
    finally{setLoginBusy(false);}
  }
  async function logout() {
    if(authToken) fetch(publicAPI+'/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+authToken}}).catch(()=>{});
    setAuthToken('');setLiveProducts([]);setLiveOrders([]);setLiveTasks([]);setLiveAgents([]);setMode('DEMO');
  }
  useEffect(()=>{
    if(mode!=='LIVE'||!authToken||!allowedLive)return;
    let cancelled=false;const controller=new AbortController();setLiveLoading(true);setDataError('');
    const headers={Authorization:'Bearer '+authToken};
    Promise.all([
      fetch(publicAPI+'/api/woo/products',{headers,signal:controller.signal}),
      fetch(publicAPI+'/api/woo/orders',{headers,signal:controller.signal}),
      fetch(publicAPI+'/tasks',{headers,signal:controller.signal}),
      fetch(publicAPI+'/api/agents',{headers,signal:controller.signal}),
    ]).then(async responses=>{
      if(responses.some(r=>!r.ok))throw new Error('A API recusou uma ou mais consultas: '+responses.map(r=>r.status).join(', '));
      return Promise.all(responses.map(r=>r.json()));
    }).then(([p,o,t,a])=>{
      if(cancelled)return;
      setLiveProducts(Array.isArray(p.products)?p.products:[]);
      setLiveOrders(Array.isArray(o.orders)?o.orders:[]);
      setLiveTasks(Array.isArray(t.tasks)?t.tasks:[]);
      setLiveAgents(Array.isArray(a.agents)?a.agents:[]);
    }).catch(e=>{if(!cancelled)setDataError(e instanceof Error?e.message:'Não foi possível carregar dados reais');})
    .finally(()=>{if(!cancelled)setLiveLoading(false);});
    return ()=>{cancelled=true;controller.abort();};
  },[mode,authToken]);
  useEffect(()=>{
    if(mode!=='LIVE'||!authToken||!allowedLive){setCommerceReview(null);setCommerceReviewError('');return;}
    let cancelled=false;
    const controller=new AbortController();
    fetch(publicAPI+'/api/automation/review',{headers:{Authorization:'Bearer '+authToken},signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
      .then(data=>{if(!cancelled){setCommerceReview(data as CommerceReview);setCommerceReviewError('');}})
      .catch(e=>{if(!cancelled){setCommerceReview(null);setCommerceReviewError(e instanceof Error?e.message:'Falha na consulta de automação');}});
    return ()=>{cancelled=true;controller.abort();};
  },[mode,authToken]);
  const liveReady = apiConfigured && apiStatus==='healthy';
  const demo=mode==='DEMO';
  const changePage=(p:Page)=>{setPage(p);setSearch('');};
  useEffect(()=>{document.documentElement.dataset.theme=theme;window.localStorage.setItem('droper-theme',theme)},[theme]);
  useEffect(()=>{
    if(!apiConfigured){setApiStatus('idle');return;}
    let cancelled=false;
    const controller=new AbortController();
    setApiStatus('loading');
    // A reachable /health endpoint is necessary, never sufficient, for WooCommerce connectivity.
    fetch(publicAPI+'/health',{signal:controller.signal,cache:'no-store'})
      .then(async r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json() as Promise<{status?:string;service?:string}>;})
      .then(d=>{
        if(cancelled)return;
        setApiStatus(d.status==='healthy'&&d.service==='droperagent-api'?'healthy':'error');
        setCheckedAt(new Date().toLocaleTimeString('pt-BR'));
      })
      .catch(()=>{if(!cancelled){setApiStatus('error');setCheckedAt(new Date().toLocaleTimeString('pt-BR'));}});
    return ()=>{cancelled=true;controller.abort();};
  },[connectionAttempt]);
  // Backend verification is independent of admin login and DEMO/LIVE mode.
  // The endpoint is public, read-only and never returns WooCommerce credentials.
  useEffect(()=>{
    if(!apiConfigured){setWooState('unknown');return;}
    let cancelled=false;
    fetch(publicAPI+'/health/woocommerce',{signal:AbortSignal.timeout(15000)})
      .then(async r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json() as Promise<{configured?:boolean;connected?:boolean}>;})
      .then(d=>{if(!cancelled)setWooState(d.connected===true?'connected':d.configured===false?'unconfigured':'unreachable');})
      .catch(()=>{if(!cancelled)setWooState('unreachable');});
    return ()=>{cancelled=true;};
  },[connectionAttempt]);
  const health=useMemo(()=>apiStatus==='healthy'?'API verificada · WooCommerce exige verificação separada':apiStatus==='loading'?'Verificando backend HTTPS…':apiStatus==='error'?'Backend indisponível · confira o endereço e tente novamente':'Backend não configurado',[apiStatus]);
  const refresh=()=>{setConnectionAttempt(n=>n+1);};
  return <div className="app-shell">
    {navOpen&&<button className="mobile-overlay" aria-label="Fechar menu" onClick={()=>setNavOpen(false)}/>}
    <aside className={'sidebar '+(navOpen?'open':'')}><button className="brand-link" onClick={()=>changePage('inicio')} aria-label="Ir para início"><Brand/></button><button className="close-menu" aria-label="Fechar menu" onClick={()=>setNavOpen(false)}><X size={20}/></button><Navigation page={page} setPage={changePage} close={()=>setNavOpen(false)}/><div className="sidebar-bottom"><div className="sidebar-help"><div className="help-icon"><Terminal size={19}/></div><strong>Projeto open source</strong><span>Acompanhe o desenvolvimento no GitHub.</span><a href="https://github.com/sebastisnzoth/droperagent" target="_blank" rel="noreferrer">Acessar repositório <ArrowUpRight size={14}/></a></div><div className="sidebar-foot"><span className="avatar">D</span><span><strong>DroperAgent</strong><small>Workspace · demo</small></span><ChevronDown size={16}/></div></div></aside>
    <main className="main"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={()=>setNavOpen(true)}><Menu size={22}/></button><span className="breadcrumb">Workspace <span>/</span> <strong>{titles[page]}</strong></span></div><div className="top-actions"><DemoBadge mode={mode}/><button className="icon-button theme-button" aria-label={theme==='dark'?'Ativar tema claro':'Ativar tema escuro'} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-button notification" onClick={()=>changePage('diagnostics')} aria-label="Ver diagnóstico"><Bell size={19}/><i/></button><span className="top-avatar">DA</span></div></header>
    <div className="content">
    {page==='inicio'?<Home go={()=>changePage('overview')}/>:<>
      <div className="page-header"><div><div className="eyebrow">DROPERAGENT / COMMERCE OPERATIONS</div><h1>{titles[page]}</h1><p>{page==='overview'?'Uma visão clara do seu workspace, em tempo real quando conectado.':page==='products'?'Gerencie o catálogo de produtos da operação.':page==='orders'?'Acompanhe os pedidos da loja em um só lugar.':page==='agents'?'Especialidades planejadas para o seu time de agentes.':page==='tasks'?'Acompanhe cada etapa do trabalho automatizado.':page==='integrations'?'Conecte ferramentas essenciais ao seu e-commerce.':page==='settings'?'Preferências de apresentação e acesso à plataforma.':'Saúde do ambiente e prontidão das integrações.'}</p></div><div className="header-cta">{page==='overview'&&<button className="outline-btn" onClick={refresh} disabled={!apiConfigured}><RefreshCw size={16}/> Verificar conexão</button>}</div></div>
      <div className="environment-banner"><div className="banner-icon"><ShieldCheck size={21}/></div><div><strong>{demo?'Você está visualizando dados de demonstração':health}</strong><span>{demo?'Produtos e pedidos de demonstração. '+(apiConfigured?'Verificação da API: '+(apiStatus==='healthy'?'OK':apiStatus==='loading'?'em andamento':'indisponível')+'.':'A API pública ainda não foi configurada.'):'A API respondeu. Entre com sua senha para consultar WooCommerce; a loja é verificada separadamente.'}</span></div><button className="mode-switch" disabled={demo?!liveReady:false} title={demo&&!liveReady?'Aguardando verificação da API HTTPS':undefined} onClick={()=>setMode(demo?'LIVE':'DEMO')}>{demo?'Modo LIVE':'Modo DEMO'} <ArrowRight size={15}/></button></div>
      {!demo&&!authToken&&<section className="panel login-panel"><h3>Acesso administrativo</h3><p>Entre com sua senha de administrador. A sessão fica somente na memória desta aba e expira automaticamente no servidor.</p><form onSubmit={login}><label htmlFor="adminPassword">Senha do administrador</label><input id="adminPassword" type="password" autoComplete="current-password" required minLength={1} value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary" type="submit" disabled={loginBusy}>{loginBusy?'Entrando…':'Entrar no modo LIVE'}</button></form>{loginError&&<p role="alert" className="error-message">{loginError}</p>}</section>}
      {!demo&&authToken&&<div className="live-session"><span><LockKeyhole size={16}/> Sessão administrativa ativa · {liveLoading?'Atualizando dados reais…':'Dados consultados na API segura'}</span><button className="outline-btn" onClick={logout}>Sair</button></div>}
      {!demo&&authToken&&dataError&&<p role="alert" className="error-message">{dataError}. Nenhum dado fictício será exibido.</p>}
      {page==='overview'&&<><Stats demo={demo} productCount={authToken&&!dataError?liveProducts.length:-1} orderCount={authToken&&!dataError?liveOrders.length:-1}/><div className="two-column"><Panel title="Visão do catálogo" subtitle="Amostra dos últimos produtos" action={<button className="text-action" onClick={()=>changePage('products')}>Ver todos <ArrowUpRight size={15}/></button>}>{demo?<ProductTable demo search=""/>:authToken&&!dataError?<LiveProducts data={liveProducts} search=""/>:<Empty title="Sem dados autenticados" detail="Conecte a sessão LIVE e confira a disponibilidade da API."/>}</Panel><Panel title="Atividade da operação" subtitle={demo?'Cenário demonstrativo':'Nenhuma atividade real disponível'}>{demo?<div className="activity-list">{[{label:'Produto adicionado ao catálogo',meta:'Simulação • há 12 minutos',icon:Package},{label:'Pedido atualizado',meta:'Simulação • há 42 minutos',icon:ShoppingBag},{label:'Verificação de integração',meta:'Simulação • há 2 horas',icon:Activity}].map(({label,meta,icon:Icon})=><div className="activity" key={label}><span className="activity-icon"><Icon size={18}/></span><div><strong>{label}</strong><small>{meta}</small></div><span className="activity-mark"/></div>)}</div>:<Empty title="Sem atividade verificada" detail="Conecte um backend seguro para visualizar logs reais."/>}</Panel></div><Pipeline/>{!demo&&<Panel title="Análise de comércio real" subtitle="Somente leitura · WooCommerce autenticado · sem pedidos ou pagamentos automáticos">{authToken?commerceReview?<div className="info-list">
  <div><span>Produtos consultados</span><strong>{commerceReview.scope.productsScanned}</strong></div>
  <div><span>Produtos com custo verificado</span><strong>{commerceReview.summary.productsWithVerifiedLandedCost}</strong></div>
  <div><span>Pedidos pagos aguardando revisão DSers</span><strong>{commerceReview.summary.paidOrdersForSupplierReview}</strong></div>
  <div><span>Pagamento automático a fornecedores</span><strong>DESATIVADO</strong></div>
  <div><span>Melhores candidatos do catálogo</span><strong>{commerceReview.products.slice(0,3).map(p=>p.name).join(' · ')||'Nenhum'}</strong></div>
  <div><span>Margens calculadas</span><strong>{commerceReview.products.filter(p=>p.estimatedGrossMarginPercent!==null).length} com custo comprovado</strong></div>
  </div>:<Empty title={commerceReviewError?'Falha na análise':'Consultando WooCommerce'} detail={commerceReviewError||'Analisando produtos e pedidos reais…'}/>:<Empty title="Requer sessão LIVE" detail="Entre com sua senha administrativa para executar a análise real."/>}</Panel>}</>}
      {page==='products'&&<Panel title="Catálogo de produtos" subtitle={demo?'4 registros de exemplo — sem conexão WooCommerce':'Nenhuma consulta comercial disponível'}><SectionToolbar search={search} setSearch={setSearch} placeholder="Buscar por produto ou categoria..."/>{demo?<ProductTable demo search={search}/>:authToken&&!dataError?<LiveProducts data={liveProducts} search={search}/>:<Empty title="Autenticação necessária" detail="Entre no modo LIVE para consultar produtos reais."/>}</Panel>}
      {page==='orders'&&<Panel title="Todos os pedidos" subtitle={demo?'Pedidos fictícios para validar a interface':'Pedidos reais indisponíveis'}><SectionToolbar search={search} setSearch={setSearch} placeholder="Buscar pedido ou cliente..."/>{demo?<OrdersTable demo search={search}/>:authToken&&!dataError?<LiveOrders data={liveOrders} search={search}/>:<Empty title="Autenticação necessária" detail="Entre no modo LIVE para consultar pedidos reais."/>}</Panel>}
      {page==='agents'&&<><Panel title="Especialidades do sistema" subtitle="Papéis planejados; nenhum agente de IA está verificado como online"><div className="agent-grid">{(demo?agents:[]).map(a=><div className="agent-card" key={a.name}><div className="agent-head"><span className="agent-mark">{a.icon}</span><span className="agent-offline">NÃO CONECTADO</span></div><strong>{a.name}</strong><small>{a.area}</small><div className="agent-line"><Activity size={14}/> Sem execução comprovada</div></div>)}</div>{!demo&&<Empty title={liveAgents.length?'Agentes consultados':'Nenhum agente conectado'} detail="Nenhuma telemetria real de agentes foi recebida."/>}</Panel></>}
      {page==='tasks'&&<><div className="mini-stats"><div><strong>{demo?'2':'—'}</strong><span>Exemplos pendentes</span></div><div><strong>0</strong><span>Trabalhos reais verificados</span></div><div><strong>—</strong><span>Última sincronização</span></div></div><Panel title="Fila de tarefas" subtitle="O worker real precisa de um backend conectado">{!demo&&authToken&&!dataError?<div className="task-list">{liveTasks.map(t=><div className="task-row" key={t.id}><span className="task-symbol"><Clock3 size={18}/></span><div><strong>{t.type}</strong><small>{t.id} · {t.createdAt}</small></div><Status status={t.status}/></div>)}</div>:demo?<div className="task-list">{[{name:'Verificar catálogo WooCommerce',status:'Pendente',type:'health-check',id:'DEMO-001'},{name:'Validar conexão MCP',status:'Pendente',type:'integration-check',id:'DEMO-002'}].filter(x=>x.name.toLowerCase().includes(search.toLowerCase())).map(x=><div className="task-row" key={x.id}><span className="task-symbol"><Clock3 size={18}/></span><div><strong>{x.name}</strong><small>{x.id} · {x.type} · demonstração</small></div><Status status={x.status}/></div>)}</div>:<Empty title="Fila real indisponível" detail="A fila precisa de uma API autenticada. GitHub Pages não executa processos Node.js."/>}</Panel></>}
      {page==='integrations'&&<><IntegrationGrid wooState={wooState}/><Pipeline/></>}
      {page==='settings'&&<div className="settings-stack"><Panel title="Ambiente" subtitle="Preferências de visualização"><div className="setting-row"><div><strong>Modo de visualização</strong><p>O modo demonstração não acessa sistemas externos.</p></div><DemoBadge mode={mode}/></div><div className="setting-row"><div><strong>Aparência</strong><p>Escolha o tema para este dispositivo.</p></div><button className="outline-btn" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>} {theme==='dark'?'Claro':'Escuro'}</button></div></Panel><Panel title="Conexão de dados" subtitle="Segurança e disponibilidade"><div className="setting-row"><div><strong>API pública HTTPS</strong><p>{apiConfigured?publicAPI:'Nenhuma API de leitura segura configurada.'}</p></div><span className="diag-value">{apiStatus==='healthy'?'VERIFICADA':apiStatus==='loading'?'VERIFICANDO':apiStatus==='error'?'INDISPONÍVEL':'NÃO CONFIGURADA'}</span><button className="outline-btn" disabled={!apiConfigured} onClick={refresh}><RefreshCw size={16}/> Testar</button></div><div className="setting-hint"><LockKeyhole size={19}/> Chaves WooCommerce, tokens MCP e credenciais administrativas nunca devem ser incluídos no GitHub Pages.</div></Panel></div>}
      {page==='diagnostics'&&<div className="diagnostic-layout"><Panel title="Estado dos serviços" subtitle="Sem dados comerciais simulados"><div className="diagnostic-list">{[{name:'GitHub Pages',desc:'Frontend estático',value:'ESTA INTERFACE',ok:true},{name:'API de operações',desc:allowedLive?health:'Não configurada',value:apiStatus==='healthy'?'HEALTH VERIFICADO':'NÃO VERIFICADO',ok:apiStatus==='healthy'},{name:'WordPress / WooCommerce',desc:'Verificação autenticada WooCommerce via Render',value:wooState==='connected'?'API REST CONECTADA':wooState==='checking'?'VERIFICANDO':wooState==='unconfigured'?'SEM CREDENCIAIS':wooState==='unreachable'?'FALHA NA CONSULTA':'NÃO VERIFICADO',ok:wooState==='connected'},{name:'OpenClaw / MCP',desc:'Execução local; não disponível no Pages',value:'NÃO CONECTADO',ok:false},{name:'DSers / AliExpress',desc:'Vínculo confirmado pelo operador; sem API de verificação no backend',value:'NÃO VERIFICADO PELA API',ok:false}].map(s=><div key={s.name} className="diagnostic-row"><span className={'diagnostic-indicator '+(s.ok?'verified':'')}>{s.ok?<Check size={16}/>:<X size={16}/>}</span><div><strong>{s.name}</strong><small>{s.desc}</small></div><span className="diag-value">{s.value}</span></div>)}</div></Panel><Panel title="Sobre o ambiente" subtitle="Transparência operacional"><div className="info-list"><div><span>Release</span><strong>Pages preview · 0.1</strong></div><div><span>Modo</span><strong>{mode}</strong></div><div><span>API configurada</span><strong>{allowedLive?'SIM':'NÃO'}</strong></div><div><span>Última consulta</span><strong>{checkedAt||'Não realizada'}</strong></div><div><span>Origem</span><strong>GitHub Pages</strong></div></div><a href="https://github.com/sebastisnzoth/droperagent/actions" target="_blank" rel="noreferrer" className="action-link">Ver execuções no GitHub <ArrowUpRight size={16}/></a></Panel></div>}
    </>}
    <footer className="footer"><span>© 2026 DROPERAGENT · Commerce operations, with clarity.</span><span>{demo?'Interface em modo DEMO':'LIVE · dados reais somente com autenticação'} · Nenhuma transação automática</span></footer>
    </div></main></div>;
}
export default App;
