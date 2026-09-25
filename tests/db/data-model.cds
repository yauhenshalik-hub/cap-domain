namespace my.bookshop;

entity Books {
  key ID            : UUID;
      title         : String;
      enableDetails : Boolean;
      description   : String;
      stock         : Integer;
      reorderPoint  : Integer;
      releaseDate   : Date;
      previewDate   : Date;
      statusCode    : String;
      price         : Integer;
      Author        : Association to Authors;
}

entity Authors {
  key ID    : UUID;
      name  : String;
      Books : Composition of many Books
                on Books.Author = $self;
}


entity Request {
  key ID            : UUID;
      title         : String;
      archived      : Boolean;
      internalNotes : String;
      note          : String;
      Detail        : Composition of one Details;
}

entity Details {
  key ID    : UUID;
      title  : String;
}