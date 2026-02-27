import { Job } from "@prisma/client";
import { each } from "node_modules/cheerio/dist/commonjs/api/traversing";
import { JobService } from "src/jobs/jobs.serivce";
import { PrismaService } from "src/prisma/prisma.service";

export class MapperJob {
    private jobService: JobService;
    public readonly listeJob: Job[];

    private constructor(jobService: JobService, listeJob: Job[]) {
        this.jobService = jobService;
        this.listeJob = listeJob;
    }

    public static async create(): Promise<MapperJob> {
        const jobService = new JobService(new PrismaService());
        const listeJob = await jobService.findAll()

        return new MapperJob(jobService, listeJob);
    }

    public mapJob(job: string) { 
        const normalized = this.normalize(job);
        const res = this.listeJob.find(j =>
            this.normalize(j.name) === normalized
        );
        if (res) {
            return res;
        }
        console.warn(`Job inconnue ${normalized}`);
        return null;
    }

    private normalize(str: string): string {
        return str
            .toLowerCase()
            .normalize("NFD")                     // sépare accents
            .replace(/[\u0300-\u036f]/g, "")      // enlève accents
            .replace(/[’']/g, "")                 // enlève apostrophes
            .replace(/[^a-z0-9\s]/g, "")          // enlève caractères spéciaux
            .replace(/\s+/g, " ")                 // espaces multiples -> 1
            .trim();
    }
}