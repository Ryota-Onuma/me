package cmd

import (
	"fmt"
	"os"
)

var rootCmd = &Command{
	Name:  "daily-report-creator",
	Short: "A tool for creating daily reports",
	Run: func(cmd *Command, args []string) error {
		return cmd.Help()
	},
}

func Execute() error {
	return rootCmd.Execute(os.Args[1:])
}

func init() {
	rootCmd.AddCommand(createCmd)
	rootCmd.AddCommand(generateCmd)
	rootCmd.AddCommand(integrateManualCmd)
	rootCmd.AddCommand(integrateGithubCmd)
	rootCmd.AddCommand(fetchSlackActivityCmd)
	rootCmd.AddCommand(fetchGithubActivityCmd)
	rootCmd.AddCommand(orchestrateCmd)
}

type Command struct {
	Name     string
	Short    string
	Long     string
	Run      func(cmd *Command, args []string) error
	Commands []*Command
	parent   *Command
}

func (c *Command) AddCommand(cmd *Command) {
	cmd.parent = c
	c.Commands = append(c.Commands, cmd)
}

func (c *Command) Execute(args []string) error {
	if len(args) == 0 {
		if c.Run != nil {
			return c.Run(c, args)
		}
		return c.Help()
	}

	subcommandName := args[0]

	for _, subcmd := range c.Commands {
		if subcmd.Name == subcommandName {
			return subcmd.Execute(args[1:])
		}
	}

	if subcommandName == "help" || subcommandName == "-h" || subcommandName == "--help" {
		return c.Help()
	}

	// If we have a Run function and no subcommand matches, pass all args to Run
	if c.Run != nil {
		return c.Run(c, args)
	}

	return fmt.Errorf("unknown command: %s", subcommandName)
}

func (c *Command) Help() error {
	fmt.Printf("%s\n\n", c.Short)

	if c.Long != "" {
		fmt.Printf("%s\n\n", c.Long)
	}

	fmt.Println("Usage:")
	fmt.Printf("  %s [command]\n\n", c.Name)

	if len(c.Commands) > 0 {
		fmt.Println("Available Commands:")
		for _, cmd := range c.Commands {
			fmt.Printf("  %-15s %s\n", cmd.Name, cmd.Short)
		}
		fmt.Println()
	}

	fmt.Println("Use \"help [command]\" for more information about a command.")
	return nil
}
