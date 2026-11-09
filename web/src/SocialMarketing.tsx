import { useState } from 'react';
import { Facebook, Instagram, Megaphone, ShieldCheck, ExternalLink, LockKeyhole, Image as ImageIcon } from 'lucide-react';
import './social.css';

export default function SocialMarketing(){
  const [channel,setChannel]=useState<'instagram'|'facebook'>('instagram');
  const [kind,setKind]=useState<'brand'|'education'>('brand');
  const [caption,setCaption]=useState('Conheça a DROPERAGENT! Estamos preparando uma operação de e-commerce mais transparente. Acompanhe as novidades. #DROPERAGENT #EcommerceBrasil');
  const [media,setMedia]=useState('');
  const [message,setMessage]=useState('');
  const valid=caption.trim().length>=10&&caption.length<=2000&&(!media||/^https:\/\//i.test(media));
  const regenerate=()=>{
    setCaption(kind==='brand'?'DROPERAGENT: tecnologia e transparência para organizar o e-commerce. Acompanhe a evolução do projeto! #DROPERAGENT #EcommerceBrasil':'Antes de vender online, calcule custo do produto, frete, tributos, taxas e devoluções. Pesquisar antes de anunciar faz a diferença. #EcommerceBrasil #DicasDeNegócios');
    setMessage('Modelo inserido no editor. Nenhuma publicação criada.');
  };
  return <div className="social-center">
    <div className="social-intro"><Megaphone size={24}/><div><strong>Marketing orgânico · modo preparação</strong><p>Contas Meta ainda não conectadas. Esta interface não envia, agenda ou salva publicações no servidor. Sem anúncios pagos.</p></div><span className="social-warning">PUBLICAÇÃO BLOQUEADA</span></div>
    <div className="social-connections">
      <section><div className="social-platform"><Instagram size={26}/></div><div><strong>Instagram Professional</strong><p>Business ou Creator · conta não conectada</p><span className="social-warning">PENDENTE</span></div><a href="https://www.instagram.com/" rel="noreferrer" target="_blank">Criar conta <ExternalLink size={14}/></a></section>
      <section><div className="social-platform"><Facebook size={26}/></div><div><strong>Página do Facebook</strong><p>Permissões de gestão e publicação não verificadas</p><span className="social-warning">PENDENTE</span></div><a href="https://www.facebook.com/pages/create" rel="noreferrer" target="_blank">Criar página <ExternalLink size={14}/></a></section>
    </div>
    <div className="social-columns">
      <section className="panel social-editor"><h3>Editor de conteúdo</h3><p>Rascunho local temporário — não persistido</p>
        <label htmlFor="social-channel">Canal</label><select id="social-channel" value={channel} onChange={e=>setChannel(e.target.value as 'instagram'|'facebook')}><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select>
        <label htmlFor="social-kind">Campanha</label><select id="social-kind" value={kind} onChange={e=>setKind(e.target.value as 'brand'|'education')}><option value="brand">Institucional · sem oferta</option><option value="education">Educacional · sem oferta</option></select>
        <label htmlFor="social-caption">Legenda em português brasileiro</label><textarea id="social-caption" rows={7} maxLength={2000} value={caption} onChange={e=>setCaption(e.target.value)}/><small>{caption.length}/2000 caracteres</small>
        <label htmlFor="social-media">Imagem licenciada (URL opcional na prévia)</label><input id="social-media" type="url" placeholder="https://..." value={media} onChange={e=>setMedia(e.target.value)}/><small>URLs e direitos de uso devem ser verificados antes da publicação.</small>
        <div className="social-actions"><button type="button" className="outline-btn" onClick={regenerate}>Gerar modelo</button><button type="button" className="primary" disabled={!valid} onClick={()=>setMessage('Rascunho revisado apenas nesta aba. Conecte a Meta e o backend para salvar ou publicar.')}><ShieldCheck size={16}/> Revisar</button></div>
        {message&&<p className="social-feedback" role="status">{message}</p>}
      </section>
      <section className="panel social-preview-panel"><h3>Prévia · {channel==='instagram'?'Instagram':'Facebook'}</h3><p>Prévia editorial; não representa uma postagem real.</p><div className="social-preview"><div className="social-preview-bar">{channel==='instagram'?<Instagram size={19}/>:<Facebook size={19}/>} <strong>DROPERAGENT</strong><span>RASCUNHO</span></div><div className="social-image"><ImageIcon size={31}/><span>{media?'Imagem vinculada (não validada)':'Sem imagem licenciada'}</span></div><p>{caption||'Sua legenda aparecerá aqui.'}</p></div><div className="setting-hint"><LockKeyhole size={18}/> Nunca inserir chaves, senhas ou tokens da Meta no GitHub Pages.</div></section>
    </div>
    <section className="panel social-next"><h3>Checklist para ativar a publicação automática</h3>{['Criar contas profissionais Meta','Conectar via autorização oficial no backend','Verificar direitos das imagens e aprovar conteúdo','Validar fornecedor, custo, estoque, envio e checkout antes de anunciar produtos','Implementar fila persistente, agenda, deduplicação e métricas'].map((item,i)=><div key={item} className="social-step"><span>{i+1}</span><p>{item}</p><strong>PENDENTE</strong></div>)}</section>
  </div>;
}
