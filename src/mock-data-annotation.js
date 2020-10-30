export default function MockData(data) {
    return function (Class) {
        Class.__mockData = data;
        return Class;
    }
}