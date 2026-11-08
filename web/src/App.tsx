import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Bell, Box, Check, ChevronDown, CircleHelp, Clock3, Cloud, Code2, Database, ExternalLink, Filter, Globe2, LayoutDashboard, LockKeyhole, Menu, Moon, Package, RefreshCw, Search, Settings2, ShieldCheck, ShoppingBag, Sun, Terminal, Users, Workflow, X, Zap } from 'lucide-react';

type Page = 'inicio' | 'overview' | 'products' | 'orders' | 'agents' | 'tasks' | 'integrations' | 'settings' | 'diagnostics';
type Mode = 'DEMO' | 'LIVE';
type Item = { id: string; name: string; category: string; price: string; stock: number; status: 'Rascunho' | 'Ativo' | 'Pausado' };
type Order = { id: string; client: string; item: string; amount: string; status: 'Pendente' | 'Processando' | 'Concluído'; date: string };
type Agent = { name: string; area: string; icon: string };
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
function Stats({demo}: {demo:boolean}) {
  const cards = [
    { label:'Produtos no catálogo', value:demo?'04':'—',change:'4 itens ilustrativos',icon:Package,className:'aqua' },
    { label:'Pedidos registrados',value:demo?'03':'—',change:'Sem vendas reais',icon:ShoppingBag,className:'blue' },
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
function Pipeline() {
  return <div className="pipeline"><div className="pipeline-title"><div><span className="eyebrow">ARQUITETURA</span><h3>Um fluxo. Várias conexões.</h3></div><span className="pipe-label">VISÃO CONCEITUAL</span></div><div className="pipeline-track">{[{name:'WordPress',sub:'Sua loja',icon:Globe2},{name:'WooCommerce',sub:'Seus produtos',icon:ShoppingBag},{name:'MCP',sub:'Ferramentas',icon:Code2},{name:'Agentes de IA',sub:'Automação',icon:Zap}].map(({name,sub,icon:Icon},i)=><div className="pipeline-segment" key={name}><div className="pipeline-node"><Icon size={23}/></div><div><strong>{name}</strong><small>{sub}</small></div>{i!==3&&<ArrowRight size={17} className="pipeline-arrow"/>}</div>)}</div><div className="pipeline-note"><CircleHelp size={16}/> Esquema de integração. Não indica serviços conectados nesta página.</div></div>;
}
function Home({go}: {go:()=>void}) {
  return <div className="home-page"><div className="home-hero"><div className="hero-kicker"><span className="hero-bullet"/> UMA NOVA FORMA DE OPERAR E-COMMERCE</div><h1>Mais clareza.<br/><em>Menos trabalho</em><br/>no operacional.</h1><p>Seu futuro centro de comando para produtos, pedidos, fornecedores e agentes de IA — com o controle sempre nas suas mãos.</p><div className="hero-actions"><button className="primary" onClick={go}>Explorar painel <ArrowUpRight size={19}/></button><a className="secondary" href="https://github.com/sebastisnzoth/droperagent" target="_blank" rel="noreferrer">Ver repositório <ExternalLink size={16}/></a></div><div className="hero-fine"><ShieldCheck size={17}/> Demonstração pública. Nenhuma venda ou operação real é executada.</div><div className="hero-orbit orbit-1"/><div className="hero-orbit orbit-2"/><div className="hero-orbit orbit-3"><Box size={44}/></div></div><div className="home-below"><div><span className="eyebrow">SOBRE A PLATAFORMA</span><h2>Da ideia à operação, em um só painel.</h2><p>DroperAgent está em desenvolvimento. Esta versão apresenta o design do centro de operações enquanto as conexões reais são verificadas.</p></div><div className="feature-column"><div><Package size={20}/><strong>Catálogo inteligente</strong><span>Organize produtos e acompanhe seus estados.</span></div><div><Workflow size={20}/><strong>Fluxos coordenados</strong><span>Visualize tarefas, integrações e automações.</span></div><div><ShieldCheck size={20}/><strong>Controle transparente</strong><span>Veja o que está conectado — e o que não está.</span></div></div></div></div>;
}
function IntegrationGrid() {return <div className="integration-grid">{connectors.map(c=><div className="integration-card" key={c.name}><div className="connector-top"><span className={'connector-logo '+c.color}>{c.initial}</span><span className="offline-dot" title="Não conectado"/></div><strong>{c.name}</strong><small>{c.desc}</small><div className="connector-status"><span/> NÃO CONFIGURADO</div></div>)}</div>;}
function SectionToolbar({search,setSearch,placeholder}: {search:string;setSearch:(s:string)=>void;placeholder:string}) {return <div className="section-toolbar"><label className="searchbox"><Search size={18}/><input aria-label="Buscar" value={search} onChange={e=>setSearch(e.target.value)} placeholder={placeholder}/></label><span className="sample-caption"><Filter size={15}/> Filtro em tempo real</span></div>;}
function App() {
  const [page,setPage]=useState<Page>('inicio');
  const [mode,setMode]=useState<Mode>('DEMO');
  const [search,setSearch]=useState('');
  const [navOpen,setNavOpen]=useState(false);
  const [theme,setTheme]=useState<'light'|'dark'>(()=>window.localStorage.getItem('droper-theme')==='dark'?'dark':'light');
  const [apiStatus,setApiStatus]=useState<'idle'|'loading'|'healthy'|'error'>('idle');
  const [checkedAt,setCheckedAt]=useState('');
  const demo=mode==='DEMO';
  const changePage=(p:Page)=>{setPage(p);setSearch('');};
  useEffect(()=>{document.documentElement.dataset.theme=theme;window.localStorage.setItem('droper-theme',theme)},[theme]);
  useEffect(()=>{if(mode!=='LIVE'||!allowedLive){setApiStatus('idle');return;}let cancelled=false;setApiStatus('loading');fetch(publicAPI+'/health',{credentials:'include',signal:AbortSignal.timeout(7000)}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(d=>{if(!cancelled){setApiStatus(d.status==='healthy'?'healthy':'error');setCheckedAt(new Date().toLocaleTimeString('pt-BR'));}}).catch(()=>{if(!cancelled)setApiStatus('error');});return ()=>{cancelled=true;};},[mode]);
  const health=useMemo(()=>apiStatus==='healthy'?'API responde ao health check':apiStatus==='loading'?'Consultando backend…':apiStatus==='error'?'Backend indisponível':'Backend não conectado',[apiStatus]);
  const refresh=()=>{if(mode==='LIVE'&&allowedLive){setMode('DEMO');setTimeout(()=>setMode('LIVE'),0);}};
  return <div className="app-shell">
    {navOpen&&<button className="mobile-overlay" aria-label="Fechar menu" onClick={()=>setNavOpen(false)}/>}
    <aside className={'sidebar '+(navOpen?'open':'')}><button className="brand-link" onClick={()=>changePage('inicio')} aria-label="Ir para início"><Brand/></button><button className="close-menu" aria-label="Fechar menu" onClick={()=>setNavOpen(false)}><X size={20}/></button><Navigation page={page} setPage={changePage} close={()=>setNavOpen(false)}/><div className="sidebar-bottom"><div className="sidebar-help"><div className="help-icon"><Terminal size={19}/></div><strong>Projeto open source</strong><span>Acompanhe o desenvolvimento no GitHub.</span><a href="https://github.com/sebastisnzoth/droperagent" target="_blank" rel="noreferrer">Acessar repositório <ArrowUpRight size={14}/></a></div><div className="sidebar-foot"><span className="avatar">D</span><span><strong>DroperAgent</strong><small>Workspace · demo</small></span><ChevronDown size={16}/></div></div></aside>
    <main className="main"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={()=>setNavOpen(true)}><Menu size={22}/></button><span className="breadcrumb">Workspace <span>/</span> <strong>{titles[page]}</strong></span></div><div className="top-actions"><DemoBadge mode={mode}/><button className="icon-button theme-button" aria-label={theme==='dark'?'Ativar tema claro':'Ativar tema escuro'} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-button notification" onClick={()=>changePage('diagnostics')} aria-label="Ver diagnóstico"><Bell size={19}/><i/></button><span className="top-avatar">DA</span></div></header>
    <div className="content">
    {page==='inicio'?<Home go={()=>changePage('overview')}/>:<>
      <div className="page-header"><div><div className="eyebrow">DROPERAGENT / COMMERCE OPERATIONS</div><h1>{titles[page]}</h1><p>{page==='overview'?'Uma visão clara do seu workspace, em tempo real quando conectado.':page==='products'?'Gerencie o catálogo de produtos da operação.':page==='orders'?'Acompanhe os pedidos da loja em um só lugar.':page==='agents'?'Especialidades planejadas para o seu time de agentes.':page==='tasks'?'Acompanhe cada etapa do trabalho automatizado.':page==='integrations'?'Conecte ferramentas essenciais ao seu e-commerce.':page==='settings'?'Preferências de apresentação e acesso à plataforma.':'Saúde do ambiente e prontidão das integrações.'}</p></div><div className="header-cta">{page==='overview'&&<button className="outline-btn" onClick={refresh} disabled={demo}><RefreshCw size={16}/> Atualizar status</button>}</div></div>
      <div className="environment-banner"><div className="banner-icon"><ShieldCheck size={21}/></div><div><strong>{demo?'Você está visualizando dados de demonstração':health}</strong><span>{demo?'Produtos, pedidos e atividades abaixo são exemplos fictícios. Nenhuma operação será executada.':apiStatus==='healthy'?'Somente o health check da API foi verificado. Dados comerciais não estão habilitados.':'Não é possível exibir dados reais sem conexão segura e sessão autorizada.'}</span></div><button className="mode-switch" disabled={!allowedLive} title={!allowedLive?'Backend HTTPS público ainda não configurado':undefined} onClick={()=>setMode(demo?'LIVE':'DEMO')}>{demo?'Modo LIVE':'Modo DEMO'} <ArrowRight size={15}/></button></div>
      {page==='overview'&&<><Stats demo={demo}/><div className="two-column"><Panel title="Visão do catálogo" subtitle="Amostra dos últimos produtos" action={<button className="text-action" onClick={()=>changePage('products')}>Ver todos <ArrowUpRight size={15}/></button>}><ProductTable demo={demo} search=""/></Panel><Panel title="Atividade da operação" subtitle={demo?'Cenário demonstrativo':'Nenhuma atividade real disponível'}>{demo?<div className="activity-list">{[{label:'Produto adicionado ao catálogo',meta:'Simulação • há 12 minutos',icon:Package},{label:'Pedido atualizado',meta:'Simulação • há 42 minutos',icon:ShoppingBag},{label:'Verificação de integração',meta:'Simulação • há 2 horas',icon:Activity}].map(({label,meta,icon:Icon})=><div className="activity" key={label}><span className="activity-icon"><Icon size={18}/></span><div><strong>{label}</strong><small>{meta}</small></div><span className="activity-mark"/></div>)}</div>:<Empty title="Sem atividade verificada" detail="Conecte um backend seguro para visualizar logs reais."/>}</Panel></div><Pipeline/></>}
      {page==='products'&&<Panel title="Catálogo de produtos" subtitle={demo?'4 registros de exemplo — sem conexão WooCommerce':'Nenhuma consulta comercial disponível'}><SectionToolbar search={search} setSearch={setSearch} placeholder="Buscar por produto ou categoria..."/><ProductTable demo={demo} search={search}/></Panel>}
      {page==='orders'&&<Panel title="Todos os pedidos" subtitle={demo?'Pedidos fictícios para validar a interface':'Pedidos reais indisponíveis'}><SectionToolbar search={search} setSearch={setSearch} placeholder="Buscar pedido ou cliente..."/><OrdersTable demo={demo} search={search}/></Panel>}
      {page==='agents'&&<><Panel title="Especialidades do sistema" subtitle="Papéis planejados; nenhum agente de IA está verificado como online"><div className="agent-grid">{agents.map(a=><div className="agent-card" key={a.name}><div className="agent-head"><span className="agent-mark">{a.icon}</span><span className="agent-offline">NÃO CONECTADO</span></div><strong>{a.name}</strong><small>{a.area}</small><div className="agent-line"><Activity size={14}/> Sem execução comprovada</div></div>)}</div></Panel></>}
      {page==='tasks'&&<><div className="mini-stats"><div><strong>{demo?'2':'—'}</strong><span>Exemplos pendentes</span></div><div><strong>0</strong><span>Trabalhos reais verificados</span></div><div><strong>—</strong><span>Última sincronização</span></div></div><Panel title="Fila de tarefas" subtitle="O worker real precisa de um backend conectado">{demo?<div className="task-list">{[{name:'Verificar catálogo WooCommerce',status:'Pendente',type:'health-check',id:'DEMO-001'},{name:'Validar conexão MCP',status:'Pendente',type:'integration-check',id:'DEMO-002'}].filter(x=>x.name.toLowerCase().includes(search.toLowerCase())).map(x=><div className="task-row" key={x.id}><span className="task-symbol"><Clock3 size={18}/></span><div><strong>{x.name}</strong><small>{x.id} · {x.type} · demonstração</small></div><Status status={x.status}/></div>)}</div>:<Empty title="Fila real indisponível" detail="A fila precisa de uma API autenticada. GitHub Pages não executa processos Node.js."/>}</Panel></>}
      {page==='integrations'&&<><IntegrationGrid/><Pipeline/></>}
      {page==='settings'&&<div className="settings-stack"><Panel title="Ambiente" subtitle="Preferências de visualização"><div className="setting-row"><div><strong>Modo de visualização</strong><p>O modo demonstração não acessa sistemas externos.</p></div><DemoBadge mode={mode}/></div><div className="setting-row"><div><strong>Aparência</strong><p>Escolha o tema para este dispositivo.</p></div><button className="outline-btn" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>} {theme==='dark'?'Claro':'Escuro'}</button></div></Panel><Panel title="Conexão de dados" subtitle="Segurança e disponibilidade"><div className="setting-row"><div><strong>API pública HTTPS</strong><p>{allowedLive?publicAPI:'Nenhuma API de leitura segura configurada.'}</p></div><Status status="Pausado"/></div><div className="setting-hint"><LockKeyhole size={19}/> Chaves WooCommerce, tokens MCP e credenciais administrativas nunca devem ser incluídos no GitHub Pages.</div></Panel></div>}
      {page==='diagnostics'&&<div className="diagnostic-layout"><Panel title="Estado dos serviços" subtitle="Sem dados comerciais simulados"><div className="diagnostic-list">{[{name:'GitHub Pages',desc:'Frontend estático',value:'ESTA INTERFACE',ok:true},{name:'API de operações',desc:allowedLive?health:'Não configurada',value:apiStatus==='healthy'?'HTTP OK':'NÃO VERIFICADO',ok:apiStatus==='healthy'},{name:'WooCommerce',desc:'Requer backend e autenticação',value:'NÃO VERIFICADO',ok:false},{name:'OpenClaw / MCP',desc:'Execução local; não disponível no Pages',value:'NÃO CONECTADO',ok:false},{name:'DSers / AliExpress',desc:'Necessita credenciais e integrações externas',value:'NÃO CONECTADO',ok:false}].map(s=><div key={s.name} className="diagnostic-row"><span className={'diagnostic-indicator '+(s.ok?'verified':'')}>{s.ok?<Check size={16}/>:<X size={16}/>}</span><div><strong>{s.name}</strong><small>{s.desc}</small></div><span className="diag-value">{s.value}</span></div>)}</div></Panel><Panel title="Sobre o ambiente" subtitle="Transparência operacional"><div className="info-list"><div><span>Release</span><strong>Pages preview · 0.1</strong></div><div><span>Modo</span><strong>{mode}</strong></div><div><span>API configurada</span><strong>{allowedLive?'SIM':'NÃO'}</strong></div><div><span>Última consulta</span><strong>{checkedAt||'Não realizada'}</strong></div><div><span>Origem</span><strong>GitHub Pages</strong></div></div><a href="https://github.com/sebastisnzoth/droperagent/actions" target="_blank" rel="noreferrer" className="action-link">Ver execuções no GitHub <ArrowUpRight size={16}/></a></Panel></div>}
    </>}
    <footer className="footer"><span>© 2026 DROPERAGENT · Commerce operations, with clarity.</span><span>Interface demonstrativa · Nenhuma transação real</span></footer>
    </div></main></div>;
}
export default App;
