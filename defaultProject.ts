import { CProject } from '../../shared/types.ts';

export const DEFAULT_C_CODE = `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    printf("Welcome to CodeForge C IDE.\\n");
    return 0;
}
`;

export const MULTI_FILE_HEADER = `#ifndef UTILS_H
#define UTILS_H

int calculate_fibonacci(int n);
void print_banner(const char *title);

#endif // UTILS_H
`;

export const MULTI_FILE_UTILS = `#include <stdio.h>
#include "utils.h"

int calculate_fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    int a = 0, b = 1, c = 0;
    for (int i = 2; i <= n; i++) {
        c = a + b;
        a = b;
        b = c;
    }
    return c;
}

void print_banner(const char *title) {
    printf("========================================\\n");
    printf("  %s\\n", title);
    printf("========================================\\n");
}
`;

export const MULTI_FILE_MAIN = `#include <stdio.h>
#include "utils.h"

int main(void) {
    print_banner("CodeForge C Multi-File Demo");

    for (int i = 0; i <= 10; i++) {
        printf("Fibonacci(%d) = %d\\n", i, calculate_fibonacci(i));
    }

    return 0;
}
`;

export const INITIAL_PROJECT: CProject = {
  id: 'default-project-1',
  name: 'CodeForge Project',
  description: 'Default C starter project',
  files: [
    {
      id: 'file-main-c',
      name: 'main.c',
      path: 'main.c',
      content: DEFAULT_C_CODE,
      updatedAt: Date.now(),
    },
  ],
  activeFileId: 'file-main-c',
  openFileIds: ['file-main-c'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  stdin: '',
};

export const createDefaultProject = (): CProject => ({
  ...INITIAL_PROJECT,
  id: `default-proj-${Date.now()}`,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  files: INITIAL_PROJECT.files.map((f) => ({ ...f, updatedAt: Date.now() })),
});



export const TEMPLATE_PROJECTS: Array<{ name: string; description: string; project: () => CProject }> = [
  {
    name: 'Hello World (Basic)',
    description: 'Clean single-file C entry point with stdio',
    project: () => ({
      id: `proj-${Date.now()}-1`,
      name: 'Hello World',
      description: 'Basic C starter template',
      files: [
        {
          id: `file-${Date.now()}-1`,
          name: 'main.c',
          path: 'main.c',
          content: DEFAULT_C_CODE,
          updatedAt: Date.now(),
        },
      ],
      activeFileId: `file-${Date.now()}-1`,
      openFileIds: [`file-${Date.now()}-1`],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stdin: '',
    }),
  },
  {
    name: 'Interactive Input (scanf & fgets)',
    description: 'Demonstrates reading integers, floats, and strings from standard input',
    project: () => {
      const now = Date.now();
      const fileId = `file-${now}-input`;
      return {
        id: `proj-${now}-input`,
        name: 'Interactive Input (scanf & fgets)',
        description: 'Read user input with scanf and formatted output in C',
        files: [
          {
            id: fileId,
            name: 'main.c',
            path: 'main.c',
            content: `#include <stdio.h>

int main(void) {
    char name[50];
    int age;
    double score;

    printf("========================================\\n");
    printf("  Interactive C Input Demo\\n");
    printf("========================================\\n");

    printf("Enter your first name: ");
    if (scanf("%49s", name) != 1) {
        printf("Failed to read name.\\n");
        return 1;
    }

    printf("Enter your age: ");
    if (scanf("%d", &age) != 1) {
        printf("Failed to read age.\\n");
        return 1;
    }

    printf("Enter your test score (0-100): ");
    if (scanf("%lf", &score) != 1) {
        printf("Failed to read score.\\n");
        return 1;
    }

    printf("\\n--- RESULTS ---\\n");
    printf("Welcome, %s!\\n", name);
    printf("Age: %d years old\\n", age);
    printf("Score: %.2f%%\\n", score);

    if (score >= 90.0) {
        printf("Grade: A (Excellent!)\\n");
    } else if (score >= 75.0) {
        printf("Grade: B (Good job!)\\n");
    } else {
        printf("Grade: C (Keep practicing!)\\n");
    }

    return 0;
}
`,
            updatedAt: now,
          },
        ],
        activeFileId: fileId,
        openFileIds: [fileId],
        createdAt: now,
        updatedAt: now,
        stdin: 'Alex 24 95.5',
      };
    },
  },
  {
    name: 'Modular Multi-File Project',
    description: 'Header (.h) and implementation (.c) separation',
    project: () => {
      const now = Date.now();
      const mainId = `file-${now}-main`;
      const utilsHId = `file-${now}-utils-h`;
      const utilsCId = `file-${now}-utils-c`;
      return {
        id: `proj-${now}-modular`,
        name: 'Modular C Project',
        description: 'Multi-file compilation with header file and utils module',
        files: [
          {
            id: mainId,
            name: 'main.c',
            path: 'main.c',
            content: MULTI_FILE_MAIN,
            updatedAt: now,
          },
          {
            id: utilsHId,
            name: 'utils.h',
            path: 'utils.h',
            content: MULTI_FILE_HEADER,
            updatedAt: now,
          },
          {
            id: utilsCId,
            name: 'utils.c',
            path: 'utils.c',
            content: MULTI_FILE_UTILS,
            updatedAt: now,
          },
        ],
        activeFileId: mainId,
        openFileIds: [mainId, utilsHId, utilsCId],
        createdAt: now,
        updatedAt: now,
        stdin: '',
      };
    },
  },
  {
    name: 'Dynamic Data Structures (Linked List & Binary Tree)',
    description: 'Pointers, memory allocation, and tree traversal',
    project: () => {
      const now = Date.now();
      const fileId = `file-${now}-tree`;
      return {
        id: `proj-${now}-dsa`,
        name: 'Binary Search Tree & Linked List',
        description: 'Data structures in pure C with dynamic memory allocation',
        files: [
          {
            id: fileId,
            name: 'main.c',
            path: 'main.c',
            content: `#include <stdio.h>
#include <stdlib.h>

typedef struct BSTNode {
    int key;
    struct BSTNode *left;
    struct BSTNode *right;
} BSTNode;

BSTNode* create_node(int key) {
    BSTNode *node = (BSTNode*)malloc(sizeof(BSTNode));
    if (!node) return NULL;
    node->key = key;
    node->left = node->right = NULL;
    return node;
}

BSTNode* insert(BSTNode *root, int key) {
    if (root == NULL) return create_node(key);
    if (key < root->key) {
        root->left = insert(root->left, key);
    } else if (key > root->key) {
        root->right = insert(root->right, key);
    }
    return root;
}

void inorder(BSTNode *root) {
    if (root != NULL) {
        inorder(root->left);
        printf("%d ", root->key);
        inorder(root->right);
    }
}

void free_tree(BSTNode *root) {
    if (root != NULL) {
        free_tree(root->left);
        free_tree(root->right);
        free(root);
    }
}

int main(void) {
    BSTNode *root = NULL;
    int values[] = { 50, 30, 20, 40, 70, 60, 80 };
    int n = sizeof(values) / sizeof(values[0]);

    printf("Inserting values into Binary Search Tree:\\n");
    for (int i = 0; i < n; i++) {
        printf(" + %d\\n", values[i]);
        root = insert(root, values[i]);
    }

    printf("\\nIn-order Traversal (Sorted Order):\\n ");
    inorder(root);
    printf("\\n");

    free_tree(root);
    printf("Memory cleaned up safely.\\n");
    return 0;
}
`,
            updatedAt: now,
          },
        ],
        activeFileId: fileId,
        openFileIds: [fileId],
        createdAt: now,
        updatedAt: now,
        stdin: '',
      };
    },
  },
  {
    name: 'Sorting Algorithms Benchmark',
    description: 'QuickSort and MergeSort with execution timing',
    project: () => {
      const now = Date.now();
      const fileId = `file-${now}-sort`;
      return {
        id: `proj-${now}-sort`,
        name: 'Sorting Algorithms Benchmark',
        description: 'Comparison of QuickSort vs InsertionSort in C',
        files: [
          {
            id: fileId,
            name: 'main.c',
            path: 'main.c',
            content: `#include <stdio.h>
#include <stdlib.h>
#include <time.h>

void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return (i + 1);
}

void quick_sort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quick_sort(arr, low, pi - 1);
        quick_sort(arr, pi + 1, high);
    }
}

int main(void) {
    int arr[] = { 64, 34, 25, 12, 22, 11, 90, 88, 45, 5, 73, 19 };
    int n = sizeof(arr) / sizeof(arr[0]);

    printf("Original Array:\\n");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n\\n");

    quick_sort(arr, 0, n - 1);

    printf("QuickSort Sorted Array:\\n");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");

    return 0;
}
`,
            updatedAt: now,
          },
        ],
        activeFileId: fileId,
        openFileIds: [fileId],
        createdAt: now,
        updatedAt: now,
        stdin: '',
      };
    },
  },
];
