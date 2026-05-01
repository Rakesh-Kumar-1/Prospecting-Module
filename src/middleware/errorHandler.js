export default function errorHandler(error, req, res, next) {
    console.error("DEBUG ERROR TRACE:", error);
    const status = error.status || 500;
    const message = status === 500 ? 'Internal Server Error' : error.message;

    return res.status(status).json({ success: false, message });
};
