export const performanceLogger = (operation) => {
    return async (req, res, next) => {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            
            if (duration > 100) { // Log slow requests
                console.log(`SLOW ${operation}: ${duration}ms`, {
                    path: req.path,
                    query: req.query
                });
            };
        });

        next();
    }
}