#include "cdll.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

#define ANSI_GREEN "\033[0;32m"
#define ANSI_RED   "\033[0;31m"
#define ANSI_RESET "\033[0m"

static int tests_passed = 0;
static int tests_failed = 0;

#define TEST_ASSERT(cond, msg) do { \
    if (cond) { \
        printf("  [PASS] %s\n", msg); \
        tests_passed++; \
    } else { \
        printf(ANSI_RED "  [FAIL] %s" ANSI_RESET " (Line %d)\n", msg, __LINE__); \
        tests_failed++; \
    } \
} while(0)

void test_empty_list(void) {
    printf("\n--- Test 1: Empty Playlist Invariants ---\n");
    CircularPlaylist* list = playlist_create();
    TEST_ASSERT(list != NULL, "playlist_create returns non-NULL");
    TEST_ASSERT(list->head == NULL, "Empty list head is NULL");
    TEST_ASSERT(list->current == NULL, "Empty list current is NULL");
    TEST_ASSERT(list->count == 0, "Empty list count is 0");
    TEST_ASSERT(playlist_next(list) == NULL, "Next on empty list returns NULL");
    TEST_ASSERT(playlist_previous(list) == NULL, "Previous on empty list returns NULL");
    TEST_ASSERT(playlist_validate_integrity(list, NULL, 0) == 1, "Integrity validation passes for empty list");
    playlist_destroy(list);
}

void test_single_node(void) {
    printf("\n--- Test 2: Single Node Addition & Self-Circularity ---\n");
    CircularPlaylist* list = playlist_create();
    int res = playlist_add(list, "t1", "Bohemian Rhapsody", "Queen", MEDIA_TYPE_AUDIO, "path/to/t1.mp3");
    TEST_ASSERT(res == 1, "playlist_add succeeded");
    TEST_ASSERT(list->count == 1, "Count is 1");
    TEST_ASSERT(list->head != NULL, "Head is non-NULL");
    TEST_ASSERT(list->current == list->head, "Current points to head");
    TEST_ASSERT(list->head->next == list->head, "Single node next points to itself");
    TEST_ASSERT(list->head->prev == list->head, "Single node prev points to itself");
    TEST_ASSERT(playlist_validate_integrity(list, NULL, 0) == 1, "Single-node integrity is valid");

    /* Next and previous on single node should return the node itself */
    MediaNode* nextNode = playlist_next(list);
    TEST_ASSERT(nextNode == list->head, "Next on single node returns head");
    MediaNode* prevNode = playlist_previous(list);
    TEST_ASSERT(prevNode == list->head, "Previous on single node returns head");

    playlist_destroy(list);
}

void test_multi_node_circularity(void) {
    printf("\n--- Test 3: Multi-Node Addition & Bidirectional Invariants ---\n");
    CircularPlaylist* list = playlist_create();
    playlist_add(list, "t1", "Track 1", "Artist 1", MEDIA_TYPE_AUDIO, "src1");
    playlist_add(list, "t2", "Track 2", "Artist 2", MEDIA_TYPE_AUDIO, "src2");
    playlist_add(list, "t3", "Track 3", "Artist 3", MEDIA_TYPE_VIDEO, "src3");

    TEST_ASSERT(list->count == 3, "Count is 3");
    MediaNode* n1 = list->head;
    MediaNode* n2 = n1->next;
    MediaNode* n3 = n2->next;

    TEST_ASSERT(strcmp(n1->id, "t1") == 0, "n1 id is t1");
    TEST_ASSERT(strcmp(n2->id, "t2") == 0, "n2 id is t2");
    TEST_ASSERT(strcmp(n3->id, "t3") == 0, "n3 id is t3");

    /* Forward loop */
    TEST_ASSERT(n3->next == n1, "Tail next points to head (t3->next == t1)");

    /* Backward loop */
    TEST_ASSERT(n1->prev == n3, "Head prev points to tail (t1->prev == t3)");
    TEST_ASSERT(n2->prev == n1, "n2 prev points to n1");
    TEST_ASSERT(n3->prev == n2, "n3 prev points to n2");

    /* Bidirectional invariant */
    TEST_ASSERT(n1->next->prev == n1, "n1->next->prev == n1");
    TEST_ASSERT(n2->next->prev == n2, "n2->next->prev == n2");
    TEST_ASSERT(n3->next->prev == n3, "n3->next->prev == n3");

    TEST_ASSERT(playlist_validate_integrity(list, NULL, 0) == 1, "Multi-node integrity is valid");
    playlist_destroy(list);
}

void test_navigation_wraparound(void) {
    printf("\n--- Test 4 & 5: Continuous Wraparound Navigation ---\n");
    CircularPlaylist* list = playlist_create();
    playlist_add(list, "t1", "Track 1", "Artist 1", MEDIA_TYPE_AUDIO, "src1");
    playlist_add(list, "t2", "Track 2", "Artist 2", MEDIA_TYPE_AUDIO, "src2");
    playlist_add(list, "t3", "Track 3", "Artist 3", MEDIA_TYPE_VIDEO, "src3");

    /* Current starts at t1 */
    TEST_ASSERT(strcmp(list->current->id, "t1") == 0, "Current starts at t1");

    /* Move to t2 */
    MediaNode* step1 = playlist_next(list);
    TEST_ASSERT(strcmp(step1->id, "t2") == 0, "Step 1: Next is t2");

    /* Move to t3 (tail) */
    MediaNode* step2 = playlist_next(list);
    TEST_ASSERT(strcmp(step2->id, "t3") == 0, "Step 2: Next is t3 (Tail)");

    /* Wrap around to t1 (head) */
    MediaNode* step3 = playlist_next(list);
    TEST_ASSERT(strcmp(step3->id, "t1") == 0, "Step 3: Next wraps around to t1 (Head)");

    /* Backward wraparound from head to tail */
    MediaNode* stepBack = playlist_previous(list);
    TEST_ASSERT(strcmp(stepBack->id, "t3") == 0, "Step 4: Previous wraps around from Head to Tail (t3)");

    playlist_destroy(list);
}

void test_removal_edge_cases(void) {
    printf("\n--- Test 6-10: Removal Operations (Single, Head, Tail, Mid, Nonexistent) ---\n");
    
    /* Case 1: Removing single node */
    CircularPlaylist* list1 = playlist_create();
    playlist_add(list1, "t1", "Sole Track", "Artist", MEDIA_TYPE_AUDIO, "src");
    int rem1 = playlist_remove(list1, "t1");
    TEST_ASSERT(rem1 == 1, "Remove only node returns 1");
    TEST_ASSERT(list1->count == 0, "Count is now 0");
    TEST_ASSERT(list1->head == NULL, "Head is now NULL");
    TEST_ASSERT(list1->current == NULL, "Current is now NULL");
    TEST_ASSERT(playlist_validate_integrity(list1, NULL, 0) == 1, "List is valid empty state");
    playlist_destroy(list1);

    /* Case 2: Removing head node in multi-node list */
    CircularPlaylist* list2 = playlist_create();
    playlist_add(list2, "t1", "Track 1", "Artist 1", MEDIA_TYPE_AUDIO, "src1");
    playlist_add(list2, "t2", "Track 2", "Artist 2", MEDIA_TYPE_AUDIO, "src2");
    playlist_add(list2, "t3", "Track 3", "Artist 3", MEDIA_TYPE_VIDEO, "src3");
    
    int remHead = playlist_remove(list2, "t1");
    TEST_ASSERT(remHead == 1, "Remove head returns 1");
    TEST_ASSERT(list2->count == 2, "Count is now 2");
    TEST_ASSERT(strcmp(list2->head->id, "t2") == 0, "Head updated to t2");
    TEST_ASSERT(list2->head->prev == playlist_find(list2, "t3"), "New head prev points to t3");
    TEST_ASSERT(playlist_find(list2, "t3")->next == list2->head, "Tail next points to new head t2");
    TEST_ASSERT(playlist_validate_integrity(list2, NULL, 0) == 1, "List integrity preserved after head removal");
    playlist_destroy(list2);

    /* Case 3: Removing tail node */
    CircularPlaylist* list3 = playlist_create();
    playlist_add(list3, "t1", "Track 1", "Artist 1", MEDIA_TYPE_AUDIO, "src1");
    playlist_add(list3, "t2", "Track 2", "Artist 2", MEDIA_TYPE_AUDIO, "src2");
    playlist_add(list3, "t3", "Track 3", "Artist 3", MEDIA_TYPE_VIDEO, "src3");

    int remTail = playlist_remove(list3, "t3");
    TEST_ASSERT(remTail == 1, "Remove tail returns 1");
    TEST_ASSERT(list3->count == 2, "Count is now 2");
    TEST_ASSERT(list3->head->prev == playlist_find(list3, "t2"), "Head prev now points to new tail t2");
    TEST_ASSERT(playlist_find(list3, "t2")->next == list3->head, "New tail t2 next points to head t1");
    TEST_ASSERT(playlist_validate_integrity(list3, NULL, 0) == 1, "List integrity preserved after tail removal");
    playlist_destroy(list3);

    /* Case 4: Removing current item updates current to successor */
    CircularPlaylist* list4 = playlist_create();
    playlist_add(list4, "t1", "Track 1", "Artist 1", MEDIA_TYPE_AUDIO, "src1");
    playlist_add(list4, "t2", "Track 2", "Artist 2", MEDIA_TYPE_AUDIO, "src2");
    playlist_add(list4, "t3", "Track 3", "Artist 3", MEDIA_TYPE_VIDEO, "src3");
    playlist_select(list4, "t2");
    TEST_ASSERT(strcmp(list4->current->id, "t2") == 0, "Current is t2");

    playlist_remove(list4, "t2");
    TEST_ASSERT(list4->count == 2, "Count is 2");
    TEST_ASSERT(strcmp(list4->current->id, "t3") == 0, "Current advanced to successor t3");
    TEST_ASSERT(playlist_validate_integrity(list4, NULL, 0) == 1, "List integrity preserved after current removal");
    playlist_destroy(list4);

    /* Case 5: Removing nonexistent item */
    CircularPlaylist* list5 = playlist_create();
    playlist_add(list5, "t1", "Track 1", "Artist 1", MEDIA_TYPE_AUDIO, "src1");
    int remNon = playlist_remove(list5, "nonexistent");
    TEST_ASSERT(remNon == 0, "Removing nonexistent item returns 0");
    TEST_ASSERT(list5->count == 1, "Count remains 1");
    playlist_destroy(list5);
}

void test_insert_after(void) {
    printf("\n--- Test 11: Insert After Node ---\n");
    CircularPlaylist* list = playlist_create();
    playlist_add(list, "t1", "Track 1", "Artist 1", MEDIA_TYPE_AUDIO, "src1");
    playlist_add(list, "t3", "Track 3", "Artist 3", MEDIA_TYPE_AUDIO, "src3");

    int ins = playlist_insert_after(list, "t1", "t2", "Track 2", "Artist 2", MEDIA_TYPE_VIDEO, "src2");
    TEST_ASSERT(ins == 1, "Insert after t1 succeeded");
    TEST_ASSERT(list->count == 3, "Count is 3");

    MediaNode* n1 = list->head;
    MediaNode* n2 = n1->next;
    MediaNode* n3 = n2->next;

    TEST_ASSERT(strcmp(n2->id, "t2") == 0, "Inserted node is in second position");
    TEST_ASSERT(n2->prev == n1, "Inserted node prev is n1");
    TEST_ASSERT(n2->next == n3, "Inserted node next is n3");
    TEST_ASSERT(n3->prev == n2, "n3 prev is updated to inserted node");
    TEST_ASSERT(playlist_validate_integrity(list, NULL, 0) == 1, "Integrity verified after insert_after");

    playlist_destroy(list);
}

void test_search(void) {
    printf("\n--- Test 12: Search Non-Mutating ---\n");
    CircularPlaylist* list = playlist_create();
    playlist_add(list, "t1", "Bohemian Rhapsody", "Queen", MEDIA_TYPE_AUDIO, "src1");
    playlist_add(list, "t2", "Hotel California", "Eagles", MEDIA_TYPE_AUDIO, "src2");
    playlist_add(list, "t3", "Under Pressure", "Queen & David Bowie", MEDIA_TYPE_AUDIO, "src3");

    playlist_select(list, "t2");
    TEST_ASSERT(strcmp(list->current->id, "t2") == 0, "Current is t2");

    MediaNode* results[5];
    int matches = playlist_search(list, "queen", results, 5);
    TEST_ASSERT(matches == 2, "Search for 'queen' found 2 matches");
    TEST_ASSERT(strcmp(results[0]->id, "t1") == 0, "Match 1 is t1");
    TEST_ASSERT(strcmp(results[1]->id, "t3") == 0, "Match 2 is t3");

    /* Search must NOT alter current pointer */
    TEST_ASSERT(strcmp(list->current->id, "t2") == 0, "Current pointer unchanged after search");

    playlist_destroy(list);
}

void test_deliberate_corruption(void) {
    printf("\n--- Test 13: Integrity Check on Corrupted Links ---\n");
    CircularPlaylist* list = playlist_create();
    playlist_add(list, "t1", "Track 1", "Artist 1", MEDIA_TYPE_AUDIO, "src1");
    playlist_add(list, "t2", "Track 2", "Artist 2", MEDIA_TYPE_AUDIO, "src2");

    char err_buf[256];
    TEST_ASSERT(playlist_validate_integrity(list, err_buf, sizeof(err_buf)) == 1, "Uncorrupted list passes validation");

    /* Deliberately break forward pointer */
    MediaNode* n1 = list->head;
    MediaNode* realNext = n1->next;
    n1->next = NULL;

    int brokenRes = playlist_validate_integrity(list, err_buf, sizeof(err_buf));
    TEST_ASSERT(brokenRes == 0, "Integrity detector caught NULL next pointer");
    printf("     Detected error message: %s\n", err_buf);

    /* Restore pointer before destroy to prevent invalid memory reads */
    n1->next = realNext;
    playlist_destroy(list);
}

int main(void) {
    printf("========================================================\n");
    printf(" RUNNING C CIRCULAR DOUBLY LINKED LIST TEST SUITE\n");
    printf("========================================================\n");

    test_empty_list();
    test_single_node();
    test_multi_node_circularity();
    test_navigation_wraparound();
    test_removal_edge_cases();
    test_insert_after();
    test_search();
    test_deliberate_corruption();

    printf("\n========================================================\n");
    printf(" RESULTS: %d Passed, %d Failed\n", tests_passed, tests_failed);
    printf("========================================================\n");

    if (tests_failed == 0) {
        printf(ANSI_GREEN " ALL C DATA STRUCTURE TESTS PASSED WITH ZERO ERRORS!\n" ANSI_RESET);
        return 0;
    } else {
        printf(ANSI_RED " SOME TESTS FAILED.\n" ANSI_RESET);
        return 1;
    }
}
