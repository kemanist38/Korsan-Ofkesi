// Ortak filo sistemi (Supabase): kurma, arama, başvuru, kabul/ret, ayrılma, atma, rol verme, kapatma.
// Yetki kontrolleri veritabanı fonksiyonlarında yapılır (supabase/migrations/002_guilds.sql).
import {supa} from './supabase';
import {session} from './session';
import type {GuildRole} from './guild';
export type GuildInfo={id:number;tag:string;name:string;members:number};
export type GuildMember={uid:string;nick:string;playerNo:number;role:GuildRole};
export type GuildApplicant={uid:string;nick:string;playerNo:number};
export type MyGuild={info:GuildInfo;role:GuildRole;members:GuildMember[];applications:GuildApplicant[]};
export const guildOnline=()=>!!session.account&&!!supa();
const ROLE_ORDER:Record<GuildRole,number>={leader:0,deputy:1,member:2};
type Err={message:string}|null;
const fail=(e:Err)=>e?e.message.replace(/^.*?: /,'')||'İşlem yapılamadı':null;
async function rpc(fn:string,args:Record<string,unknown>={}):Promise<string|null>{const sb=supa();if(!sb)return'Sunucuya bağlanılamadı';const {error}=await sb.rpc(fn,args);return fail(error);}
type ProfileRef={nick:string;player_no:number}|{nick:string;player_no:number}[]|null;
const prof=(p:ProfileRef)=>Array.isArray(p)?p[0]:p;

export async function loadMyGuild():Promise<MyGuild|null>{
  const sb=supa(),me=session.account;if(!sb||!me)return null;
  const {data:row,error}=await sb.from('guild_members').select('guild_id,role').eq('user_id',me.uid).maybeSingle();if(error)throw error;if(!row)return null;
  const [g,m,a]=await Promise.all([
    sb.from('guilds').select('id,tag,name').eq('id',row.guild_id).single(),
    sb.from('guild_members').select('user_id,role,profiles(nick,player_no)').eq('guild_id',row.guild_id),
    row.role==='member'?Promise.resolve({data:[],error:null}):sb.from('guild_applications').select('user_id,profiles(nick,player_no)').eq('guild_id',row.guild_id).order('created_at'),
  ]);
  if(g.error)throw g.error;if(m.error)throw m.error;
  const members=(m.data??[]).map(r=>{const p=prof(r.profiles as ProfileRef);return{uid:r.user_id as string,nick:p?.nick??'?',playerNo:p?.player_no??0,role:r.role as GuildRole};})
    .sort((x,y)=>ROLE_ORDER[x.role]-ROLE_ORDER[y.role]||x.nick.localeCompare(y.nick,'tr'));
  const applications=((a.data??[]) as {user_id:string;profiles:ProfileRef}[]).map(r=>{const p=prof(r.profiles);return{uid:r.user_id,nick:p?.nick??'?',playerNo:p?.player_no??0};});
  return{info:{id:g.data.id,tag:g.data.tag,name:g.data.name,members:members.length},role:row.role as GuildRole,members,applications};
}
export async function searchGuilds(q:string):Promise<GuildInfo[]>{
  const sb=supa();if(!sb)return[];const t=q.trim().replace(/[%_\\,()]/g,'');
  let query=sb.from('guilds').select('id,tag,name,guild_members(count)').order('created_at',{ascending:false}).limit(30);
  if(t)query=query.or(`tag.ilike.%${t}%,name.ilike.%${t}%`);
  const {data,error}=await query;if(error)throw error;
  return(data??[]).map(r=>({id:r.id,tag:r.tag,name:r.name,members:(r.guild_members as unknown as {count:number}[])?.[0]?.count??0}));
}
export async function myApplications():Promise<number[]>{const sb=supa(),me=session.account;if(!sb||!me)return[];const {data}=await sb.from('guild_applications').select('guild_id').eq('user_id',me.uid);return(data??[]).map(r=>r.guild_id as number);}
export async function createGuild(tag:string,name:string){const sb=supa();if(!sb)return'Sunucuya bağlanılamadı';const {error}=await sb.rpc('guild_create',{p_tag:tag,p_name:name});return fail(error);}
export const applyGuild=(id:number)=>rpc('guild_apply',{p_guild:id});
export const cancelApply=(id:number)=>rpc('guild_cancel_apply',{p_guild:id});
export const answerApplication=(uid:string,accept:boolean)=>rpc('guild_answer',{p_user:uid,p_accept:accept});
export const kickMember=(uid:string)=>rpc('guild_kick',{p_user:uid});
export const setMemberRole=(uid:string,role:'deputy'|'member')=>rpc('guild_set_role',{p_user:uid,p_role:role});
export const leaveGuild=()=>rpc('guild_leave');
export const disbandGuild=()=>rpc('guild_disband');
// Yetkiler (arayüz için; asıl kontrol veritabanında)
export const canManage=(r:GuildRole)=>r==='leader'||r==='deputy';
export const canKick=(me:GuildRole,target:GuildRole)=>me==='leader'?target!=='leader':me==='deputy'&&target==='member';
export const canDisband=(r:GuildRole)=>r==='leader';
