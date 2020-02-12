import SiteMediaMetadata from '../../base/api/base_mediametadata.js';
import request from 'cloudscraper';


const AJAX_PLAYER_API = "https://bilumoi.com/ajax/player/";
const FAKE_HEADERS = {
        "Content-type" : "application/x-www-form-urlencoded; charset=UTF-8",
        "User-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36",
        "Origin": "https://bilumoi.com",
        "Referrer": "https://bilumoi.com/",
        "Accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,vi;q=0.6",
};

class BiluTVMetadata extends SiteMediaMetadata  {

    constructor(cacheManager=null, cachePrefix="BiluTVMetadata") {
        super(cacheManager);
    }

    async _manual_getMediaMetadata(aux) {
        /* 
         @param 
                aux     {
                            "movieID"  : ...,
                            "episodeID": ...,
                            "sv"       : ...
                        }
         @return
                        {
                            "type": ..., // video-sources, iframe
                            "data" ...
                        }
        */
        try {
            let playerSrc = (await request(AJAX_PLAYER_API, 
            {
                "method": "POST",
                "headers": FAKE_HEADERS,
                "data" :
                {
                    "id": aux["movieID"],
                    "ep": aux["episodeID"],
                    "sv": aux["sv"],
                },
            })).body;
            console.log(playerSrc);
            let response = {}
            if (playerSrc.includes("box-player")) {
                let iframeUrl = playerSrc.match(/iframe .* src="(.*?)"/)[1];
                if (iframeUrl.charAt(0) == '/') // if the iframe source is a relative URL
                        iframeUrl = "https://bilumoi.com" + iframeUrl;

                return {
                    "type": "iframe",
                    "data": iframeUrl,
                }
            } else if (playerSrc.includes("<div class=\"player\">")) {
                let sources = {}
                // JSON.parse() doesn't always work because sometime their stupid script doesn't include quotation
                eval(`sources = ${playerSrc.match(/sources:( *\[(.|\n)*?\])/)[1]}`);
                if(sources.length > 0) {
                    return {
                        "type": "video-sources",
                        "data": sources
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
        return null;
    }

}

module.exports = new BiluTVMetadata();