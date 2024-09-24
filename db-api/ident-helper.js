/* borrowed-ish from cabinet/index.ts */
import Identd from "identd";
import express from "express";
console.log(Identd.default.request);
/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {Function} next 
 */
const middleware = async (req, res, next) => {
    let ident;
    try {
        ident = await Identd.default.request({
            address: req.socket.remoteAddress,
            client_port: req.socket.localPort,
            server_port: req.socket.remotePort
        });
    }
    catch(e) {
        console.error(e.stack);
        return res.status(500).json({
            "message": "Ident lookup failed."
        });
    }
    req.username = ident.userid?.toString();
    next();
};
export default middleware;