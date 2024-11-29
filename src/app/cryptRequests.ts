const hash = async (str:string)=>{
    const hashBytes = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(hashBytes)).map((k)=>k.toString(16).padStart(2,"0")).join("");
}

const generateProtection = async (params:any)=>{
    const body_data = await hash(params['body']);
    const sec_timeout = Math.floor((Date.now()/1000)/60);
    const sec_verify = await hash(sec_timeout + body_data + "protected-seating-data");
    return sec_verify
}