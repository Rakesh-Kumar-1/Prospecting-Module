import multer from 'multer';
import xlsx from 'xlsx';

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const parseExcelMiddleware = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });
        if (!req.body) req.body = {};
        req.body.prospects = data;
        next();
    } catch (err) {
        console.error("Excel parse error:", err);
        res.status(500).json({ error: 'Failed to parse excel file' });
    }
};
