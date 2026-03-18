data class Person(val name: String, val age: Int)

fun greet(person: Person): String {
    return "Hello, ${person.name}! You are ${person.age} years old."
}

fun main() {
    val people = listOf(
        Person("Alice", 30),
        Person("Bob", 25),
    )
    people.forEach { println(greet(it)) }
}
