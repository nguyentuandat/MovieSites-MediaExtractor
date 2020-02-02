import SiteAPI from './base.js';
import request from 'async-request';
import { parse } from 'node-html-parser';



const AJAX_PLAYER_API = "https://bilutv.org/ajax/player/";
const FAKE_HEADERS = {
        "Content-type" : "application/x-www-form-urlencoded; charset=UTF-8",
        "User-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36",
        "Origin": "https://bilutv.org",
        "Referrer": "https://bilutv.org/",
        "Accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,vi;q=0.6",
};


const KHOAITV_BASE_PHIMURL = "http://khoaitv.org/embed.php"
export default class BiluTVAPI extends SiteAPI  {

    constructor(cacheManager=null, cachePrefix="KhoaiTVAPI") {
        super(cacheManager);
    }

    async _manual_getMediadata(aux) {
        /* 
         @param 
                aux     {
                            "movieID"  : ...,
                            "episodeID": ...
                        }
         @return
                        {
                            "type": ..., // video-sources, iframe
                            "data" ...
                        }
        */
        try {
            let urlResp = await request(`${KHOAITV_BASE_PHIMURL}?id=${aux["movieID"]}&ep=${aux["episodeID"]}`);
            // parse content between .setup({.*}) in the new page
            let jwPlayerSetupContent = urlResp.body.match(/\.setup\({(.*?)}\)/)[0].replace(/\.setup\(( *)/,'');
            jwPlayerSetupContent = jwPlayerSetupContent.slice(0, jwPlayerSetupContent.length - 1);
            let jwSettings = {}
            try {
                eval(`jwSettings = ${jwPlayerSetupContent}`);
            } catch (e) {
                console.log("khoaitv_wrapper.js: error on parsing jwSettings:\n"+e);
            }
            // check to see whether jwPlayer has video source or not
            if(typeof jwSettings.file != 'undefined' && jwSettings.file != "blank" && jwSettings.file != "error")
            {
                return {
                    "type": "video-sources",
                    "data": jwSettings
                }
            } else {
                // if no video source, then we'd have to go with the iframe path
                let iframeSrc = urlResp.body.match(/iframe src="(.*?)"/)[0].replace('iframe src="','').replace('"','');
                return {
                    "type": "iframe",
                    "data": iframeSrc
                }
            }
        } catch (e) {
            console.log(e);
        }
        return null;
    }

}