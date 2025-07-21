class MetaDataStruct {
  constructor(totalRecords = 0, totalPages = 0, currentPage = 1,pageSize=10) {
    this.totalRecords = totalRecords;
    this.totalPages = totalPages;
    this.currentPage = currentPage;
    this.pageSize = pageSize;
  }
}
class BaseResponse {
  constructor(success = true, message = '', data = null,metaData=null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.metaData = new MetaDataStruct();
  }
}

module.exports = BaseResponse; // Export đúng cách