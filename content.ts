import { LearnLesson, CodingChallenge } from '../../shared/types.ts';

export const LESSONS: LearnLesson[] = [
  {
    id: 'intro-c',
    title: '1. Introduction to C & Anatomy of a C Program',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    summary: 'Understand the main entry point, headers (#include <stdio.h>), and standard output with printf.',
    content: `### Welcome to C Programming!
C is a procedural programming language developed in 1972 by Dennis Ritchie at Bell Labs. It remains one of the most widely used and influential programming languages in computer science, operating systems (Linux, macOS, Windows kernel), embedded systems, and game engines.

#### Anatomy of a C Program
- **\`#include <stdio.h>\`**: Preprocessor directive that imports the Standard Input/Output library.
- **\`int main()\`**: The main function where execution begins. Returns an integer exit status.
- **\`printf()\`**: Formatted print function.
- **\`return 0;\`**: Indicates standard successful termination to the operating system.`,
    codeSnippet: `#include <stdio.h>

int main(void) {
    printf("========================================\\n");
    printf(" Welcome to CodeForge C!\\n");
    printf(" Fast, Compiled, and Direct to Hardware.\\n");
    printf("========================================\\n");
    
    int year = 1972;
    printf("C Language created by Dennis Ritchie in %d.\\n", year);
    
    return 0;
}`,
    hints: ['Run the code with Ctrl+Enter', 'Try changing the year or message and see the output update!'],
  },
  {
    id: 'variables-types',
    title: '2. Data Types, Format Specifiers & Sizes',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    summary: 'Master integers, floats, doubles, chars, sizeof operator, and printf/scanf format specifiers.',
    content: `### C Primitive Types & Memory Layout
In C, types have explicit byte sizes determined by the architecture.

- \`char\`: 1 byte (-128 to 127 or 0 to 255) -> \`%c\` or \`%d\`
- \`int\`: Typically 4 bytes -> \`%d\` / \`%i\`
- \`float\`: 4 bytes single precision -> \`%f\`
- \`double\`: 8 bytes double precision -> \`%lf\`
- \`size_t\`: Unsigned integer type for sizes -> \`%zu\`

#### Format Specifiers
- \`%d\`: decimal integer
- \`%f\`: float (e.g. \`%.2f\` for 2 decimal places)
- \`%x\` / \`%p\`: hexadecimal / pointer address
- \`%s\`: null-terminated string`,
    codeSnippet: `#include <stdio.h>
#include <stdbool.h>

int main(void) {
    int age = 21;
    double gpa = 3.89;
    char grade = 'A';
    bool is_enrolled = true;

    printf("Student Info:\\n");
    printf(" Age:    %d years (Size: %zu bytes)\\n", age, sizeof(age));
    printf(" GPA:    %.2f (Size: %zu bytes)\\n", gpa, sizeof(gpa));
    printf(" Grade:  %c (ASCII code: %d)\\n", grade, grade);
    printf(" Status: %s\\n", is_enrolled ? "Active" : "Inactive");

    return 0;
}`,
    hints: ['Check how `sizeof()` returns the actual byte count', 'Try formatting floating numbers with %.4f'],
  },
  {
    id: 'control-flow',
    title: '3. Control Flow: Conditionals, Loops & Switches',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    summary: 'Branching logic (if/else, switch) and iteration (for, while, do-while).',
    content: `### Control Structures in C
C provides standard structured programming constructs:
- **if / else if / else**: Conditional execution based on boolean evaluation (non-zero is true, zero is false).
- **switch / case**: Jump-table based multiway branching on integral values. Always remember \`break\`!
- **for, while, do-while**: Iteration loops.`,
    codeSnippet: `#include <stdio.h>

int main(void) {
    printf("Collatz Conjecture sequence starting from 6:\\n");
    int n = 6;
    int steps = 0;

    while (n != 1) {
        printf("%d -> ", n);
        if (n % 2 == 0) {
            n = n / 2;
        } else {
            n = 3 * n + 1;
        }
        steps++;
    }
    printf("1 (Reached in %d steps)\\n", steps);

    return 0;
}`,
    hints: ['Try changing n to any other positive integer in the code!'],
  },
  {
    id: 'pointers-basics',
    title: '4. Pointers & Memory Addresses',
    category: 'Pointers & Memory',
    difficulty: 'Intermediate',
    summary: 'Understand the address-of operator (&), dereference operator (*), and pointer variables.',
    content: `### The Essence of C: Pointers
A **pointer** is a variable whose value is the memory address of another variable.

- **Address-of Operator (\`&\`)**: Returns the hexadecimal memory address where variable is stored.
- **Dereference Operator (\`*\`)**: Accesses the value stored at the address pointed to.
- **Pass-by-Reference**: Allows functions to modify variables in caller scopes.`,
    codeSnippet: `#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main(void) {
    int x = 42;
    int *ptr = &x;

    printf("Value of x:              %d\\n", x);
    printf("Address of x (&x):       %p\\n", (void*)&x);
    printf("Value of ptr:            %p\\n", (void*)ptr);
    printf("Value at *ptr:           %d\\n\\n", *ptr);

    // Modifying through pointer
    *ptr = 100;
    printf("After *ptr = 100, x is:  %d\\n\\n", x);

    // Swap demonstration
    int a = 10, b = 20;
    printf("Before swap: a=%d, b=%d\\n", a, b);
    swap(&a, &b);
    printf("After swap:  a=%d, b=%d\\n", a, b);

    return 0;
}`,
    hints: ['Always cast pointer arguments in printf to (void*) for %p compatibility.'],
  },
  {
    id: 'dynamic-memory',
    title: '5. Dynamic Memory: malloc, calloc, realloc & free',
    category: 'Pointers & Memory',
    difficulty: 'Intermediate',
    summary: 'Allocate heap memory dynamically at runtime and prevent memory leaks.',
    content: `### Heap Allocation in C
- \`malloc(size)\`: Allocates uninitialized memory.
- \`calloc(num, size)\`: Allocates and zero-initializes memory.
- \`realloc(ptr, new_size)\`: Resizes an existing heap block.
- \`free(ptr)\`: Releases the memory back to the operating system.

**Golden Rule of C Memory:** Every \`malloc\` must have an associated \`free\`. Always check for \`NULL\` return!`,
    codeSnippet: `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n = 5;
    int *arr = (int *)malloc(n * sizeof(int));

    if (arr == NULL) {
        fprintf(stderr, "Fatal: Out of memory!\\n");
        return 1;
    }

    // Populate array with squares
    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * (i + 1);
    }

    printf("Dynamically allocated array on Heap:\\n");
    for (int i = 0; i < n; i++) {
        printf(" arr[%d] = %d (Address: %p)\\n", i, arr[i], (void*)&arr[i]);
    }

    // Expand array with realloc
    int new_n = 8;
    int *temp = (int *)realloc(arr, new_n * sizeof(int));
    if (temp != NULL) {
        arr = temp;
        for (int i = n; i < new_n; i++) {
            arr[i] = (i + 1) * (i + 1);
        }
        printf("\\nExpanded to %d elements:\\n", new_n);
        for (int i = 0; i < new_n; i++) {
            printf(" %d", arr[i]);
        }
        printf("\\n");
    }

    // Clean up
    free(arr);
    arr = NULL;
    printf("\\nMemory freed successfully.\\n");

    return 0;
}`,
    hints: ['Setting ptr = NULL after free() avoids dangling pointer bugs.'],
  },
  {
    id: 'structs-data-structures',
    title: '6. Structs & Custom Types',
    category: 'Data Structures',
    difficulty: 'Intermediate',
    summary: 'Group heterogeneous fields, create typedefs, and use the arrow operator (->).',
    content: `### Structs in C
A \`struct\` allows you to bundle multiple related variables under a single custom data type.
Use \`.\` to access fields on a direct struct instance, and \`->\` to access fields via a pointer.`,
    codeSnippet: `#include <stdio.h>
#include <string.h>

typedef struct {
    char title[64];
    char author[64];
    int pages;
    double price;
} Book;

void print_book(const Book *b) {
    printf("Book: '%s' by %s\\n", b->title, b->author);
    printf("Pages: %d | Price: $%.2f\\n\\n", b->pages, b->price);
}

int main(void) {
    Book b1;
    strncpy(b1.title, "The C Programming Language", sizeof(b1.title) - 1);
    strncpy(b1.author, "Kernighan & Ritchie", sizeof(b1.author) - 1);
    b1.pages = 272;
    b1.price = 49.95;

    Book b2 = {
        .title = "Clean Code",
        .author = "Robert C. Martin",
        .pages = 464,
        .price = 39.99
    };

    print_book(&b1);
    print_book(&b2);

    return 0;
}`,
    hints: ['Notice the .field designated initializer syntax in modern C99/C11.'],
  },
  {
    id: 'linked-list',
    title: '7. Data Structures: Singly Linked List',
    category: 'Data Structures',
    difficulty: 'Advanced',
    summary: 'Build a dynamic linked list node by node with traversal and memory deallocation.',
    content: `### Singly Linked Lists
A linked list is a fundamental linear data structure consisting of nodes where each node contains data and a pointer to the \`next\` node in the sequence.`,
    codeSnippet: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

Node* create_node(int data) {
    Node *new_node = (Node*)malloc(sizeof(Node));
    if (!new_node) return NULL;
    new_node->data = data;
    new_node->next = NULL;
    return new_node;
}

void append(Node **head_ref, int data) {
    Node *new_node = create_node(data);
    if (*head_ref == NULL) {
        *head_ref = new_node;
        return;
    }
    Node *last = *head_ref;
    while (last->next != NULL) {
        last = last->next;
    }
    last->next = new_node;
}

void print_list(const Node *node) {
    printf("List: [");
    while (node != NULL) {
        printf("%d%s", node->data, node->next ? " -> " : "");
        node = node->next;
    }
    printf("]\\n");
}

void free_list(Node *head) {
    Node *temp;
    while (head != NULL) {
        temp = head;
        head = head->next;
        free(temp);
    }
}

int main(void) {
    Node *head = NULL;
    
    append(&head, 10);
    append(&head, 20);
    append(&head, 30);
    append(&head, 40);

    print_list(head);
    free_list(head);
    printf("Linked list deallocated cleanly.\\n");

    return 0;
}`,
    hints: ['Double pointer (Node **head_ref) is used to modify the caller’s head pointer.'],
  },
];

export const CHALLENGES: CodingChallenge[] = [
  {
    id: 'sum-two-numbers',
    title: 'Sum of Two Numbers from Stdin',
    difficulty: 'Easy',
    category: 'Basics & I/O',
    description: 'Read two space-separated integers from standard input (\`stdin\`) and print their sum to standard output (\`stdout\`).',
    starterCode: `#include <stdio.h>

int main(void) {
    int a, b;
    // Read two integers from stdin
    if (scanf("%d %d", &a, &b) == 2) {
        // Output their sum
        printf("%d\\n", a + b);
    }
    return 0;
}`,
    hints: ['Use scanf("%d %d", &a, &b) to read values.', 'Output the integer with printf("%d\\n", sum).'],
    testCases: [
      { id: '1', input: '3 7\n', expectedOutput: '10\n', description: 'Sample: 3 + 7 = 10' },
      { id: '2', input: '100 -25\n', expectedOutput: '75\n', description: 'Positive + Negative' },
      { id: '3', input: '0 0\n', expectedOutput: '0\n', description: 'Zero sum' },
      { id: '4', input: '-50 -50\n', expectedOutput: '-100\n', description: 'Two negative integers' },
    ],
  },
  {
    id: 'reverse-string',
    title: 'In-Place String Reversal',
    difficulty: 'Easy',
    category: 'Strings & Arrays',
    description: 'Read a single-word string (up to 100 characters) from standard input, reverse it in-place using pointers or index swaps, and print the reversed string.',
    starterCode: `#include <stdio.h>
#include <string.h>

void reverse_string(char *str) {
    int len = strlen(str);
    int left = 0;
    int right = len - 1;
    while (left < right) {
        char temp = str[left];
        str[left] = str[right];
        str[right] = temp;
        left++;
        right--;
    }
}

int main(void) {
    char word[128];
    if (scanf("%127s", word) == 1) {
        reverse_string(word);
        printf("%s\\n", word);
    }
    return 0;
}`,
    hints: ['Use two pointers (left at start, right at end) and swap characters until they meet.'],
    testCases: [
      { id: '1', input: 'hello\n', expectedOutput: 'olleh\n', description: 'Sample: "hello" -> "olleh"' },
      { id: '2', input: 'CodeForge\n', expectedOutput: 'egroFedoC\n', description: 'Mixed case word' },
      { id: '3', input: 'racecar\n', expectedOutput: 'racecar\n', description: 'Palindrome stays identical' },
      { id: '4', input: 'C\n', expectedOutput: 'C\n', description: 'Single character string' },
    ],
  },
  {
    id: 'fibonacci-number',
    title: 'N-th Fibonacci Number',
    difficulty: 'Medium',
    category: 'Algorithms',
    description: 'Given an integer N (0 <= N <= 45) from standard input, compute and print the N-th Fibonacci number where F(0)=0, F(1)=1, and F(N)=F(N-1)+F(N-2).',
    starterCode: `#include <stdio.h>

long long fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    
    long long prev2 = 0;
    long long prev1 = 1;
    long long current = 0;
    
    for (int i = 2; i <= n; i++) {
        current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    return current;
}

int main(void) {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%lld\\n", fibonacci(n));
    }
    return 0;
}`,
    hints: ['Use an iterative O(N) loop with long long to avoid recursion overhead and overflow.'],
    testCases: [
      { id: '1', input: '0\n', expectedOutput: '0\n', description: 'F(0) = 0' },
      { id: '2', input: '7\n', expectedOutput: '13\n', description: 'F(7) = 13' },
      { id: '3', input: '10\n', expectedOutput: '55\n', description: 'F(10) = 55' },
      { id: '4', input: '30\n', expectedOutput: '832040\n', description: 'F(30) = 832040' },
    ],
  },
  {
    id: 'array-max-min',
    title: 'Array Min, Max and Average',
    difficulty: 'Medium',
    category: 'Arrays & Math',
    description: 'First line has integer N. Second line has N integers. Output the minimum, maximum, and average (formatted to 2 decimal places) separated by spaces.',
    starterCode: `#include <stdio.h>
#include <limits.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;

    long long sum = 0;
    int min_val = INT_MAX;
    int max_val = INT_MIN;

    for (int i = 0; i < n; i++) {
        int val;
        scanf("%d", &val);
        sum += val;
        if (val < min_val) min_val = val;
        if (val > max_val) max_val = val;
    }

    double avg = (double)sum / n;
    printf("%d %d %.2f\\n", min_val, max_val, avg);
    return 0;
}`,
    hints: ['Remember to cast sum to double before division to preserve fractional parts.'],
    testCases: [
      { id: '1', input: '5\n10 20 30 40 50\n', expectedOutput: '10 50 30.00\n', description: '5 positive numbers' },
      { id: '2', input: '4\n-5 -1 0 10\n', expectedOutput: '-5 10 1.00\n', description: 'Negative and positive numbers' },
      { id: '3', input: '1\n42\n', expectedOutput: '42 42 42.00\n', description: 'Single element array' },
    ],
  },
  {
    id: 'matrix-transpose',
    title: 'Matrix Transposition',
    difficulty: 'Hard',
    category: '2D Arrays & Matrices',
    description: 'Given dimensions R and C, followed by an R x C matrix of integers. Output the transposed C x R matrix where rows become columns.',
    starterCode: `#include <stdio.h>

int main(void) {
    int r, c;
    if (scanf("%d %d", &r, &c) != 2) return 0;

    int matrix[64][64];
    for (int i = 0; i < r; i++) {
        for (int j = 0; j < c; j++) {
            scanf("%d", &matrix[i][j]);
        }
    }

    for (int j = 0; j < c; j++) {
        for (int i = 0; i < r; i++) {
            printf("%d%s", matrix[i][j], i == r - 1 ? "" : " ");
        }
        printf("\\n");
    }

    return 0;
}`,
    hints: ['Loop with column index outer (0..C-1) and row index inner (0..R-1).'],
    testCases: [
      { id: '1', input: '2 3\n1 2 3\n4 5 6\n', expectedOutput: '1 4\n2 5\n3 6\n', description: '2x3 Matrix' },
      { id: '2', input: '3 3\n1 0 0\n0 1 0\n0 0 1\n', expectedOutput: '1 0 0\n0 1 0\n0 0 1\n', description: 'Identity 3x3 Matrix' },
    ],
  },
];
