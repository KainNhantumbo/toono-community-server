import type { Request, Response } from "express";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import xlsx from "xlsx";
import { db } from "../../database/client.database";
import Exception from "../../lib/app-exception";
import { deleteFilesInDirectory } from "../../lib/utils";

export default class BackupController {
  async export(req: Request, res: Response) {
    const { session } = req.body;
    const { type } = req.params;
    const _CSV = "csv";
    const _JSON = "json";
    const _TEXT = "text";

    const temp_folder = path.join(__dirname, "..", "..", "temp");

    const posts = await db.query.posts.findMany({
      where: (table, fn) => fn.eq(table.user_id, session.id),
      columns: {
        id: true,
        title: true,
        content: true
      }
    });

    if (posts.length < 1) throw new Exception("No posts to export.", 404);

    if (!existsSync(temp_folder)) await fs.mkdir(temp_folder);
    // delete any other files in this directory
    await deleteFilesInDirectory(temp_folder);

    let filename: string;
    let data: string;
    let worksheet: xlsx.WorkSheet;
    let workbook: xlsx.WorkBook;

    switch (type) {
      case _TEXT:
        filename = `${session.id}-${new Date().toISOString()}.txt`;
        data = posts.reduce((acc, curr) => {
          return acc.concat(
            `\n----------------------------------------------\nPost ID:\t${curr.id}\n\nTitle:\t${curr.title}\n\nContent:\t${curr.content}\n\n`
          );
        }, ``);
        await fs.writeFile(path.join(temp_folder, filename), data, { encoding: "utf8" });

        return res.download(path.join(temp_folder, filename), (error) => {
          if (error) {
            console.error("Download failed: \n\t\t", error);
            res.status(500).json({
              code: "Internal Server Error",
              status: 500,
              message: "Download failed."
            });
          }
        });

      case _JSON:
        filename = `${session.id}-${new Date().toISOString()}.json`;
        data = JSON.stringify(posts, null, 2);
        await fs.writeFile(path.join(temp_folder, filename), data, { encoding: "utf8" });

        return res.download(path.join(temp_folder, filename), (error) => {
          if (error) {
            console.error("Download failed: \n\t\t", error);
            res.status(500).json({
              code: "Internal Server Error",
              status: 500,
              message: "Download failed."
            });
          }
        });

      case _CSV:
        filename = `${session.id}-${new Date().toISOString()}.xlsx`;
        worksheet = xlsx.utils.json_to_sheet(posts);
        workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Posts");
        xlsx.utils.sheet_add_aoa(worksheet, [["Post ID", "Title", "Content"]], {
          origin: "A1"
        });
        xlsx.writeFile(workbook, path.join(temp_folder, filename));

        return res.download(path.join(temp_folder, filename), (error) => {
          if (error) {
            console.error("Download failed: \n\t\t", error);
            res.status(500).json({
              code: "Internal Server Error",
              status: 500,
              message: "Download failed."
            });
          }
        });

      default:
        throw new Exception("Invalid file type.", 400);
    }
  }
}
