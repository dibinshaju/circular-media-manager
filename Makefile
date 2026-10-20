CC = gcc
CFLAGS = -Wall -Wextra -Werror -pedantic -std=c11 -O2
DEBUG_FLAGS = -Wall -Wextra -Werror -pedantic -std=c11 -g -fsanitize=address,undefined

SRC_DIR = c_src
BIN_DIR = bin

TARGET_CLI = $(BIN_DIR)/playlist_cli
TARGET_TEST = $(BIN_DIR)/test_cdll
TARGET_DAEMON = $(BIN_DIR)/c_daemon

.PHONY: all cli test daemon clean run

all: cli test daemon

$(BIN_DIR):
	mkdir -p $(BIN_DIR)

cli: $(BIN_DIR) $(SRC_DIR)/cdll.c $(SRC_DIR)/menu_cli.c $(SRC_DIR)/cdll.h
	$(CC) $(CFLAGS) $(SRC_DIR)/cdll.c $(SRC_DIR)/menu_cli.c -o $(TARGET_CLI)
	@echo "Built: $(TARGET_CLI)"

test: $(BIN_DIR) $(SRC_DIR)/cdll.c $(SRC_DIR)/test_cdll.c $(SRC_DIR)/cdll.h
	$(CC) $(DEBUG_FLAGS) $(SRC_DIR)/cdll.c $(SRC_DIR)/test_cdll.c -o $(TARGET_TEST)
	@echo "Running C test suite with AddressSanitizer..."
	./$(TARGET_TEST)

daemon: $(BIN_DIR) $(SRC_DIR)/cdll.c $(SRC_DIR)/bridge_daemon.c $(SRC_DIR)/cdll.h
	$(CC) $(CFLAGS) $(SRC_DIR)/cdll.c $(SRC_DIR)/bridge_daemon.c -o $(TARGET_DAEMON)
	@echo "Built: $(TARGET_DAEMON)"

run: cli
	./$(TARGET_CLI)

clean:
	rm -rf $(BIN_DIR)
