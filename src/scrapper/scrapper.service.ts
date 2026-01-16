import { SessionCookies } from "./sessionCookies" 
import fetch from "node-fetch";
import * as cheerio from 'cheerio'
import { MetricsAnalyse } from "./metricsAnalyse";
import { PrismaService } from "../prisma/prisma.service";

export class ScrapperService {
    private userAgent: string;
    private cookies: SessionCookies;
    private maxRetries: number;
    private retryDelayMs: number;
    private metricsAnalyse: MetricsAnalyse; 
    private prismaService: PrismaService;

    constructor() {
        this.userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        this.cookies = new SessionCookies(); 
        this.metricsAnalyse = new MetricsAnalyse(); 
        this.maxRetries = 3;
        this.retryDelayMs = 2000;
        this.prismaService = new PrismaService();
    }

    private async httpRequest(url: string, attempt = 1) { 
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Cookie' : this.cookies.toHeader(),
                }, redirect: 'manual',
            });

            // Ingest Set-Cookie
            const setCookie = res.headers.raw()["set-cookie"];
            if (setCookie) this.cookies.ingestSetCookie(setCookie);
    
            // Si Cloudflare ou 403, retry simple
            if ((res.status === 403 || res.status === 429) && attempt <= this.maxRetries) {
                await this.sleep(this.retryDelayMs);
                return this.httpRequest(url, attempt + 1);
            }
    
            return res;
        } catch (err) {
            if (attempt <= this.maxRetries) {
            await this.sleep(this.retryDelayMs)
            return this.httpRequest(url, attempt + 1)
            }
            throw err
        }
    }

    //Logique du script de scrapping
    public async scrapperPagesList(pageType: string) {
        // Init la session
        const urlInit = 'https://www.wakfu.com/fr/mmorpg/encyclopedie';
        const resInit = await this.httpRequest(urlInit);

        //Check if good initialisation
        if(resInit.status != 200) {}
        await this.sleep(1000);
        
        //While cloudflare isn't anoying us !
        let keepGoing = true;
        let pageNumber = 1;
        let pageNumberMax = 0;
        let wentThroughAll = false;

        while(keepGoing) {
            console.log(' ----- PAGE : ' + pageNumber + ' SUR ' + pageNumberMax + ' ----- ');

            const delay = this.metricsAnalyse.getDelayMs();
            await this.sleep(delay);

            const res = await this.httpRequest(urlInit + '/' + pageType + '?page=' + pageNumber);
            const textToHtml = await this.textToHtml(await res.text(), pageNumber, pageNumberMax);
            pageNumberMax = textToHtml.pageNumberMax;

            const decision = this.metricsAnalyse.analyze(res);
            console.log(' ----- ' + decision + ' ----- ');

            switch (decision) {
                case 'OK':
                this.metricsAnalyse.speedUp();
                break;

            case 'SLOW_DOWN':
                this.metricsAnalyse.slowDown();
                break;

            case 'BACKOFF':
                this.metricsAnalyse.slowDown();
                await this.sleep(30000);
                break;

            case 'BLOCKED':
                console.log('Bloqué par Cloudflare at page' + pageNumber);
                //LANCER REQUET CUSTOM POUR POINT DE SAUVEGARDE
                this.metricsAnalyse.reset();
                keepGoing = false;
                break;
            }

            textToHtml.html('.ak-table tr').each((_, row) => {
                const $row = textToHtml.html(row);

                const link = $row.find('.ak-linker a').first().attr('href');
                if (!link) return;
                let type = $row.find('.item-type img').attr('title')?.toLocaleLowerCase();
                //Overright for the monster on the type
                if (pageType == 'monstres') {
                    type = "monstres";
                }
                const name = this.getItemNameFromUrl(link).toLocaleLowerCase();

                this.prismaService.createListeItemsLinks({
                    nameFr: name,
                    url: link,
                    type: type
                })

                console.log(name + " Has been added to the database !");
            });

            //Check if we are at the end of the pages
            if (pageNumberMax == pageNumber) {
                keepGoing = false; 
                console.log('Finished scrapping all the pages succesfully !');
            };
            //Check if cloud flaire spoted us
            if (textToHtml.keepGoing == false) {
                keepGoing = false; 
                console.log('Cloudflair as spotted us !');
            };

            // A NE PAS oublier !!!!!
            if (pageNumber == pageNumberMax) {
                keepGoing = false; 
                wentThroughAll = true;
            };

            pageNumber ++;
        };
 
        this.prismaService.saveScrapingState(urlInit + '/' + pageType + '?page=' + pageNumber, pageNumber);
        return wentThroughAll;
    }



    public async test() {
        const urlInit = 'https://www.wakfu.com/fr/mmorpg/encyclopedie'; 
        const resInit = await this.httpRequest(urlInit);
        console.log(resInit);

        await this.sleep(1000);

        const url = 'https://www.wakfu.com/fr/mmorpg/encyclopedie/armures'; 
        const res = await this.httpRequest(url);
        const html = await res.text();
        const $ = cheerio.load(html);

        console.log($('h1').first().text());
        //console.log($('.ak-linker a').first().attr('href'));
        /*$('.ak-linker a').each((_, el) => {
            console.log($(el).attr('href'))
        })*/

        $('.ak-table tr').each((_, row) => {
            const link = $(row).find('.ak-linker a').first().attr('href')
            if (!link) return;

            console.log(link);
        })

        //Get the last page to know how long to run
        const pages = $('.ak-pagination li a')
            .map((_, el) => $(el).text().trim())
            .get()
            .filter(t => /^\d+$/.test(t))
            .map(Number)

        const lastPage = Math.max(...pages);

        console.log(lastPage);
    }

    public getItemNameFromUrl(path: string): string {
        const slug = path.split('/').pop()!;
        const namePart = slug.replace(/^\d+-/, '');
        return namePart.replace(/-/g, ' ');
    }

    //Transform the text to cheerio.CheerioAPI + give the max page number if it's the 1st page + what is the next page
    //Can alert on cloudflair if there aren't any html
    private async textToHtml(text: string, pageNumber: number, pageNumberMax: number = 0) {
        const $ = cheerio.load(text);

        const res = {
            keepGoing: true,
            pageNumber: pageNumber,
            pageNumberMax: pageNumberMax,
            html: $
        };

        if (!text.includes('<html')) {
           res.keepGoing = false;
           return res;
        }

        if (text.includes('cf-challenge')) {
            res.keepGoing = false;
            return res;
        }

        //Get the last page to know how long to run
        if (pageNumber == 1) {
            const pages = $('.ak-pagination li a')
                .map((_, el) => $(el).text().trim())
                .get()
                .filter(t => /^\d+$/.test(t))
                .map(Number)
            res.pageNumberMax = Math.max(...pages);
        }

        return res;
    }

    /** Pause */
    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}