# Loopify — Circular Playlist Management System (C & Modern Web)

A responsive, playful, editorial-style music and video playlist management system driven authoritatively by a manually implemented **Circular Doubly Linked List (CDLL) in C** using structs and pointer manipulation, accompanied by an interactive C terminal program and a modern Curio-inspired web interface.

---

## 1. Important Academic & Core Data Structures Engine

All core Data Structures and Algorithms are implemented in **pure C (C11 standard)** with manual memory management (`malloc` / `free`) and strict compiler flags (`-Wall -Wextra -Werror -pedantic -std=c11`).

### Files:
- **`c_src/cdll.h`**: Data structure definition (`MediaNode`, `CircularPlaylist`) and prototypes for the 11 required operations.
- **`c_src/cdll.c`**: Pure C implementation of all circular doubly linked list operations.
- **`c_src/menu_cli.c`**: Interactive menu-driven terminal program displaying real memory addresses (`%p`), circular wraparounds, and visual pointer chains.
- **`c_src/test_cdll.c`**: Comprehensive automated test suite (69 assertions) running under **AddressSanitizer** to guarantee zero memory leaks and boundary safety.
- **`c_src/bridge_daemon.c`**: Native C daemon exposing the live C linked list via JSON IPC to the web UI.
- **`C_ACADEMIC_EXPLANATION.md`**: Complete presentation guide explaining structs, pointers, `malloc`/`free`, memory diagrams, and Big-O proofs for academic defense.

---

## 2. Required C Operations Implemented

| # | Operation | C Function | Time Complexity | Space Complexity | Description |
|---|-----------|------------|-----------------|------------------|-------------|
| 1 | **Initialize List** | `playlist_create()` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Allocates list on heap; sets `head=NULL`, `current=NULL`, `count=0`. |
| 2 | **Add Media Item** | `playlist_add()` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Appends to tail in $\mathcal{O}(1)$ using `head->prev`; rewires 4 pointers. |
| 3 | **Insert After ID** | `playlist_insert_after()` | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Finds target node by ID; splices new node into the cycle in $\mathcal{O}(1)$. |
| 4 | **Remove by ID** | `playlist_remove()` | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Searches for target; bridges neighbors; frees node; updates head/current safely. |
| 5 | **Navigate Next** | `playlist_next()` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Advances `current = current->next` with continuous circular wraparound. |
| 6 | **Navigate Previous**| `playlist_previous()` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Moves `current = current->prev` with continuous circular wraparound. |
| 7 | **Select Item** | `playlist_select()` | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Sets `current` pointer to matching node without altering order. |
| 8 | **Search by Title** | `playlist_search()` | $\mathcal{O}(n)$ | $\mathcal{O}(k)$ | Case-insensitive substring scan; non-mutating. |
| 9 | **Display Playlist** | `playlist_display()` | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Prints formatted table showing memory addresses, titles, prev, and next. |
| 10| **Clear Playlist** | `playlist_clear()` | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Traverses and frees all heap-allocated nodes, preventing memory leaks. |
| 11| **Validate Invariants**| `playlist_validate_integrity()` | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Verifies bidirectional symmetry (`next->prev == this`), count, and tail-to-head loop. |

---

## 3. Quick Start & Execution

### 3.1 Build Everything in C
```bash
make all
```
Compiles `bin/playlist_cli`, `bin/test_cdll`, and `bin/c_daemon` with `-Wall -Wextra -Werror -pedantic -std=c11 -O2`.

### 3.2 Run the Interactive C Terminal Program
```bash
make run
# or directly:
./bin/playlist_cli
```
Features in the interactive CLI:
- **Now Playing**: Shows the active song title, artist, media type, and exact 64-bit memory address on the heap (`0x556...`).
- **Pointer Status**: Shows `prev` title/address and `next` title/address.
- **Options**:
  - `[1]` Add Media Item (Append to Tail, O(1))
  - `[2]` Insert Media Item After ID (O(1) Splice)
  - `[3]` Remove Media Item by ID (O(n) Search + O(1) Unlink)
  - `[4]` Navigate Next Item (O(1) Continuous Wraparound)
  - `[5]` Navigate Previous Item (O(1) Continuous Wraparound)
  - `[6]` Select Media Item by ID
  - `[7]` Search Media by Title or Artist
  - `[8]` Display Complete Playlist & Pointer Memory Table
  - `[9]` Validate Circular Invariants (Runtime Integrity Check)
  - `[10]` Clear Entire Playlist (Free All Nodes)
  - `[11]` Re-seed Demo Sample Media
  - `[0]` Exit Application

### 3.3 Run the Automated C Test Suite (AddressSanitizer)
```bash
make test
```
Executes 69 automated test assertions with GCC's AddressSanitizer (`-fsanitize=address,undefined`) confirming zero memory leaks, zero dangling pointers, and 100% boundary safety.

---

## 4. Web Application & Native C Daemon Bridge

The project includes an editorial-style web user interface styled after the **Curio** design language (warm cream `#FFF8EC`, purple CTAs `#7450E8`, sunny yellow highlights `#FFD93D`, mint pills `#75E6C1`, charcoal borders with offset shadows):

```bash
# Terminal 1: Start the Native C Daemon HTTP Bridge
npm run c:bridge

# Terminal 2: Start the Web UI
npm run dev
```
Open `http://localhost:5173` to explore the interactive visualizer, synchronized audio/video playback, and Spotify track discovery!
