// Constructor cho User
export function User(id, username) {
    this.id = id;
    this.username = username;
}

// Constructor cho Message
export function Message(user, message) {
    this.user = user;
    this.message = message;
    this.timestamp = new Date(); // tạo thời gian tại thời điểm khởi tạo
}