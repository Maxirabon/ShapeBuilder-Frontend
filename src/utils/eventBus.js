const subscribers = {};

export const eventBus = {
    subscribe(event, callback) {
        if (!subscribers[event]) subscribers[event] = [];
        subscribers[event].push(callback);
        return () => {
            subscribers[event] = subscribers[event].filter(cb => cb !== callback);
        };
    },
    publish(event, data) {
        if (subscribers[event]) {
            subscribers[event].forEach(cb => cb(data));
        }
    }
};