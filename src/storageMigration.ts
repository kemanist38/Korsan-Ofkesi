// Pirate Rage: Korsan Öfkesi eski kayıtları korur; "kara-yelken-*" kayıtları bir kez "yedi-deniz-*" anahtarlarına taşınır.
// Bu modül main.ts'de ilk içe aktarılmalıdır (diğer modüller kayıtları okumadan önce çalışsın).
try{
  for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(!key?.startsWith('kara-yelken-'))continue;
    const next='yedi-deniz-'+key.slice('kara-yelken-'.length);if(localStorage.getItem(next)===null)localStorage.setItem(next,localStorage.getItem(key)!);localStorage.removeItem(key);}
}catch{}
export {};
