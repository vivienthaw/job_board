import express, { Request, response, Response } from "express";
import "dotenv/config";
import morgan from "morgan";
import { z, ZodError } from "zod";
import prisma from "./lib/prisma";

const app = express();
const PORT = process.env.PORT;

if (!PORT) throw new Error("PORT is missing in your env file");

app.use(express.json());
app.use(morgan("dev"));

app.listen(PORT, () => {
  console.log(`Server is running on hhtp://localhost:${PORT}`);
});
const userSchema = z.object({
  name: z.string(),
  email: z.email(),
});

const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string(),
  salary: z.number(),
  type: z.enum(["FULLTIME", "PARTTIME", "INTERN"]),
  user_id: z.string()
});

app.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, email } = userSchema.parse(req.body);
    const newUser = await prisma.user.create({
      data: { name, email },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) return res.status(400).json(error.issues);
    if (error instanceof Error) return res.status(500).json(error.message);
    res.status(500).json(error);
  }
});

app.get("/users", async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    include: {
      jobs: true,
    },
  });
  res.status(200).json(users);
});

app.post("/jobs", async (req: Request, res: Response) => {
  try {
    const { title, company, location, description,salary,type,user_id } = jobSchema.parse(req.body);
    const newJob = await prisma.jobs.create({
      data: {
        title,
        company,
        location,
        description,
        salary,
        type,
        user_id,
      },
    });
    res.status(201).json(newJob);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json(error.issues);

    if (error instanceof Error) return res.status(500).json(error.message);

    res.status(500).json(error);
  }
});

app.get("/jobs", async (_req, res: Response) => {
  const jobs = await prisma.jobs.findMany({
    
  });
  res.status(200).json(jobs);
});

app.delete("/users/:id", async (req: Request, res: Response) => {
      try {
        const id = String(req.params.id);
        const deletedUser = await prisma.user.delete({
          where: {id},
        });
        res.status(200).json(deletedUser);
      } catch (error) {
        res.status(500).json(error);
      }
});

app.get("/jobs/search/:keyword", async (req: Request, res: Response) => {
    try {
      const keyword = String(req.params.keyword);
      const jobs = await prisma.jobs.findMany({
        where: {
          OR: [
            {
              title: {
                contains: keyword,
              }
            },
            {
              company: {
                contains: keyword,
              }
            },
            {
              description: {
                contains: keyword,
              }
            }
          ]
        },
      });
      res.status(200).json(jobs);
    } catch (error) {
      return res.status(500).json(error)
    }
});