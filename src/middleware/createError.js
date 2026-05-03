export const CreateError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};