#ifndef CDLL_H
#define CDLL_H

#include <stddef.h>
#include <stdbool.h>

/**
 * MediaType Enum: Distinguishes between audio and video media items.
 */
typedef enum {
    MEDIA_TYPE_AUDIO = 0,
    MEDIA_TYPE_VIDEO = 1
} MediaType;

/**
 * MediaNode: Individual node in the Circular Doubly Linked List.
 * 
 * Invariants:
 * - In a nonempty list, next and prev are non-NULL.
 * - In a single-node list: next == this && prev == this.
 */
typedef struct MediaNode {
    char id[64];
    char title[128];
    char artist[128];
    MediaType type;
    char source[512];
    struct MediaNode* next; /* Pointer to next node in circular loop */
    struct MediaNode* prev; /* Pointer to previous node in circular loop */
} MediaNode;

/**
 * CircularPlaylist: Head controller for the playlist.
 * 
 * Invariants:
 * - When count == 0: head == NULL && current == NULL.
 * - When count > 0:
 *     - head != NULL && current != NULL
 *     - head->prev points to the tail node
 *     - tail->next points to the head node
 *     - for each node: node->next->prev == node && node->prev->next == node
 */
typedef struct {
    MediaNode* head;     /* Pointer to the first node in the list */
    MediaNode* current;  /* Pointer to the currently selected node */
    int count;           /* Total count of nodes in the playlist */
} CircularPlaylist;

/* =========================================================================
 * 11 Required Circular Doubly Linked List Operations
 * ========================================================================= */

/**
 * 1. Initialize an empty playlist.
 * Returns a heap-allocated CircularPlaylist with head=NULL, current=NULL, count=0.
 */
CircularPlaylist* playlist_create(void);

/**
 * 2. Add a media item (Append to tail in O(1) time).
 * Returns 1 on success, 0 on memory allocation failure.
 */
int playlist_add(CircularPlaylist* list, const char* id, const char* title, 
                 const char* artist, MediaType type, const char* source);

/**
 * 3. Insert a media item after a specified target ID (O(n) search + O(1) splice).
 * Returns 1 on success, 0 if target_id is not found or allocation fails.
 */
int playlist_insert_after(CircularPlaylist* list, const char* target_id, 
                          const char* id, const char* title, const char* artist, 
                          MediaType type, const char* source);

/**
 * 4. Remove a media item by ID (O(n) search + O(1) unlinking).
 * Updates head, current, and circular pointer invariants safely.
 * Returns 1 on success, 0 if ID is not found.
 */
int playlist_remove(CircularPlaylist* list, const char* id);

/**
 * 5. Navigate to the next item (O(1) with continuous wraparound).
 * Returns the newly selected current MediaNode, or NULL if list is empty.
 */
MediaNode* playlist_next(CircularPlaylist* list);

/**
 * 6. Navigate to the previous item (O(1) with continuous wraparound).
 * Returns the newly selected current MediaNode, or NULL if list is empty.
 */
MediaNode* playlist_previous(CircularPlaylist* list);

/**
 * 7. Select a media item by ID.
 * Sets list->current to the matching node and returns it, or NULL if not found.
 */
MediaNode* playlist_select(CircularPlaylist* list, const char* id);

/**
 * 8. Search by title or artist (case-insensitive substring match).
 * Populates results array with matching MediaNode pointers.
 * Does NOT alter list->current or playlist order.
 * Returns the number of matches found.
 */
int playlist_search(const CircularPlaylist* list, const char* query, 
                    MediaNode** results, int max_results);

/**
 * 9. Display the playlist to stdout.
 * Formats each node with its memory address, title, artist, prev ID, and next ID.
 */
void playlist_display(const CircularPlaylist* list);

/**
 * 10. Clear the playlist and free all allocated node memory.
 * Sets head=NULL, current=NULL, count=0.
 */
void playlist_clear(CircularPlaylist* list);

/**
 * Free all nodes and the CircularPlaylist struct itself.
 */
void playlist_destroy(CircularPlaylist* list);

/**
 * 11. Validate circular pointer integrity.
 * Verifies bidirectional links, count consistency, and tail-to-head circularity.
 * Returns 1 if all invariants hold, 0 if any corruption is detected.
 * Writes diagnostic error messages into err_buf if non-NULL.
 */
int playlist_validate_integrity(const CircularPlaylist* list, char* err_buf, size_t err_buf_size);

/**
 * Helper: Find a node by ID. Returns pointer to MediaNode or NULL if not found.
 */
MediaNode* playlist_find(const CircularPlaylist* list, const char* id);

#endif /* CDLL_H */
