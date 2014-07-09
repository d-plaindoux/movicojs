movicojs
========

Language dedicated to Model/View/Control web application design

example
=======

```
object APerson { firstname: string, name: string, age: int }

view PersonView(Person) {
  <div onClick=this.tick()> 
    <div>this.firstname()</div>
    <div>this.name()</div>
    <div>this.age()</div>
  </div>
}
 
view PersonAdder(Population) {
  <form onSubmit=this.addPerson(self)>
     <input type="text" id="firstname"/>
     <input type="text" id="name"/>
     <input type="text" id="age"/>
     <input type="submit" value="Add"/>
  </form>
}

view PopulationView(Population) {
  this.persons().map(p -> <PersonView>Person(p)</PersonView>)
  <PersonAdder>this</PersonAdder>
}

class Person(APerson) {
  firstname(): string { this.firstname; }
  name(): string { this.name; }
  age(): int { this.age; }
  tick(): Unit { this = this.age(this.age+1); }
}

class Population([APerson]) {
  persons():[APerson] { this.select(p -> p.age < 100); }
  addPerson(v:PersonAdder): Unit { this = Array(this).addTail(APerson{v.firstname,v.name,v.age}); }
}

// starter
// Document(document).render("content",PopulationView(Population([]))
// Document(document).import("...") -> Creates a view
```
