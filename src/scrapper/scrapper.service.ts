import { SessionCookies } from "./sessionCookies" 
import fetch from "node-fetch";
import * as cheerio from 'cheerio'
import { CFDecision, MetricsAnalyse } from "./metricsAnalyse";
import { PrismaService } from "../prisma/prisma.service";
import { ListeItemsLinksService } from "src/scrapper/scrapperDbLogic/listeItemsLinks.service";
import { SaveATScraping } from "src/scrapper/scrapperDbLogic/saveAtScraping.service";

export class ScrapperService {
    private userAgent: string;
    private cookies: SessionCookies;
    private maxRetries: number;
    private retryDelayMs: number;
    private metricsAnalyse: MetricsAnalyse; 
    private prismaService: PrismaService;
    private listeItemsLinks: ListeItemsLinksService;
    private saveAtScraping: SaveATScraping;

    constructor() {
        this.userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        this.cookies = new SessionCookies(); 
        this.metricsAnalyse = new MetricsAnalyse(); 
        this.maxRetries = 3;
        this.retryDelayMs = 2000;
        this.prismaService = new PrismaService();
        this.listeItemsLinks = new ListeItemsLinksService(this.prismaService);
        this.saveAtScraping = new SaveATScraping(this.prismaService);
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

    //Initialize the scraping (land on the main page to avoid cloudflare issues)
    public async scrapperInit() { 
        const urlInit = process.env.BASE_URL + '/fr/mmorpg/encyclopedie';
        let tries = 0;

        while(tries < 4) {
            const resInit = await this.httpRequest(urlInit);
            if(resInit.status == 200) {
                console.log("Initialization Successfull !");
                return;
            } 
            tries ++;
            await this.sleep(1000);
        }
        throw new Error("Fail to Initialize the Scrapper connection");
    }

    public async scrapperRunner(decision: CFDecision, url: string) {
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
            this.metricsAnalyse.reset();
            throw new Error("Blocked by cloudflair, rip", { cause: "Blocked"});
        }
        const delay = this.metricsAnalyse.getDelayMs();
        await this.sleep(delay);
        const res = await this.httpRequest(url);
        const newDecision = this.metricsAnalyse.analyze(res);

        return { res, newDecision };
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

                this.listeItemsLinks.createListeItemsLinks({
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
 
        this.saveAtScraping.saveScrapingState(urlInit + '/' + pageType + '?page=' + pageNumber, pageNumber);
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
    public sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async simpleTextToHtml(text: string) {
        if (text.includes('cf-challenge')) {
            throw new Error("We are getting challenged !", { cause: "challenge" });
        }
        return cheerio.load(text);
    }
}