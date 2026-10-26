/** Compare every pixel; tolerate only a few text-rasterization pixels inside unchanged brand marks. */
export async function compareCatalogPaint(page, before, after) {
  if (before.equals(after)) return {equal:true, rasterizationPixels:0};
  if (before.readUInt32BE(16)!==after.readUInt32BE(16) || before.readUInt32BE(20)!==after.readUInt32BE(20)) {
    return {equal:false, reason:'different screenshot dimensions'};
  }
  return page.evaluate(async ({before,after}) => {
    async function pixels(data) {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width=image.width; canvas.height=image.height;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      context.drawImage(image,0,0);
      return {width:image.width,data:context.getImageData(0,0,image.width,image.height).data};
    }
    const [a,b]=await Promise.all([pixels(before),pixels(after)]);
    const marks=[...document.querySelectorAll('.brand-mark')].map(element=>{
      const rect=element.getBoundingClientRect();
      return {left:rect.left+scrollX,right:rect.right+scrollX,top:rect.top+scrollY,bottom:rect.bottom+scrollY};
    });
    let count=0;
    for(let offset=0;offset<a.data.length;offset+=4) {
      if(a.data[offset]===b.data[offset] && a.data[offset+1]===b.data[offset+1] && a.data[offset+2]===b.data[offset+2] && a.data[offset+3]===b.data[offset+3]) continue;
      const x=(offset/4)%a.width, y=Math.floor(offset/4/a.width);
      if(!marks.some(rect=>x>=rect.left && x<rect.right && y>=rect.top && y<rect.bottom)) return {equal:false,reason:`changed pixel outside brand mark at ${x},${y}`};
      if(++count>8) return {equal:false,reason:'more than 8 brand-mark pixels changed'};
    }
    return {equal:true,rasterizationPixels:count};
  },{before:before.toString('base64'),after:after.toString('base64')});
}
